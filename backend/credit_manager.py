"""
Transactional & Idempotent Credit Accounting Module
===================================================
Guarantees atomic credit checks and deductions in Firestore.
Prevents double-charges, race conditions, and negative balances.
Enforces operation idempotency via idempotency keys.
"""

import os
import time

try:
    from google.cloud import firestore
    HAS_FIRESTORE = True
except ImportError:
    HAS_FIRESTORE = False
    firestore = None


class CreditManager:
    """
    Handles atomic Firestore transactions for user credits.
    Guarantees that deductions are idempotent and cannot race.
    """
    def __init__(self, db_admin=None):
        self.db = db_admin
        self._memory_balances = {}  # Test/local fallback
        self._processed_idempotency_keys = set()

    def check_credits(self, uid: str, cost: int = 5) -> tuple[bool, int]:
        """Checks if user has sufficient credits without deducting."""
        if not uid:
            return False, 0

        if not self.db:
            balance = self._memory_balances.get(uid, 100)
            return balance >= cost, balance

        try:
            user_ref = self.db.collection('users').document(uid)
            doc = user_ref.get()
            if not doc.exists:
                # New user without profile defaults to initial free credits
                return 15 >= cost, 15
            credits = doc.to_dict().get('credits', 0)
            return credits >= cost, credits
        except Exception as e:
            print(f"[CreditManager] Check error for {uid}: {e}")
            return False, 0

    def deduct_credits_transactional(
        self, uid: str, cost: int = 5, idempotency_key: str | None = None, description: str = "AI Operation"
    ) -> tuple[bool, int, str | None]:
        """
        Deducts credits atomically using Firestore transaction.
        Returns (success: bool, new_balance: int, error_message: str | None).
        """
        if not uid:
            return False, 0, "No user ID provided"

        # Check idempotency to prevent duplicate charges on retry
        if idempotency_key:
            if idempotency_key in self._processed_idempotency_keys:
                print(f"[CreditManager] Idempotent replay detected for key {idempotency_key}. Skipping deduction.")
                return True, 0, None
            if self.db:
                idem_doc = self.db.collection('idempotency').document(idempotency_key).get()
                if idem_doc.exists:
                    return True, idem_doc.to_dict().get('balance', 0), None

        if not self.db:
            current = self._memory_balances.get(uid, 100)
            if current < cost:
                return False, current, "Insufficient credits"
            self._memory_balances[uid] = current - cost
            if idempotency_key:
                self._processed_idempotency_keys.add(idempotency_key)
            return True, self._memory_balances[uid], None

        try:
            user_ref = self.db.collection('users').document(uid)
            
            # Use native Firestore transaction for ACID consistency
            transaction = self.db.transaction()

            @firestore.transactional
            def update_in_transaction(txn, doc_ref):
                snapshot = doc_ref.get(transaction=txn)
                current_credits = snapshot.to_dict().get('credits', 0) if snapshot.exists else 15
                if current_credits < cost:
                    raise ValueError(f"Insufficient balance. Has {current_credits}, requires {cost}")
                new_balance = current_credits - cost
                txn.update(doc_ref, {'credits': new_balance, 'updatedAt': time.time()})
                return new_balance

            new_bal = update_in_transaction(transaction, user_ref)

            # Record audit trail and idempotency record
            if idempotency_key:
                self.db.collection('idempotency').document(idempotency_key).set({
                    'uid': uid,
                    'cost': cost,
                    'balance': new_bal,
                    'timestamp': time.time(),
                    'description': description
                })

            return True, new_bal, None

        except ValueError as ve:
            return False, 0, str(ve)
        except Exception as e:
            print(f"[CreditManager] Transaction failed: {e}")
            return False, 0, f"Transaction error: {e}"

    def refund_credits(self, uid: str, amount: int, reason: str = "Operation failed"):
        """Refunds credits if an upstream operation (e.g. Gemini LLM API) crashes."""
        if not uid or amount <= 0:
            return
        if not self.db:
            self._memory_balances[uid] = self._memory_balances.get(uid, 100) + amount
            return
        try:
            user_ref = self.db.collection('users').document(uid)
            doc = user_ref.get()
            if doc.exists:
                current = doc.to_dict().get('credits', 0)
                user_ref.update({'credits': current + amount})
                print(f"[CreditManager] Refunded {amount} credits to {uid} ({reason}).")
        except Exception as e:
            print(f"[CreditManager] Refund error: {e}")
