import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: "Sarah Jenkins",
    role: "Product Manager at TechCorp",
    avatar: "S",
    color: "from-blue-500 to-cyan-500",
    text: "This editor feels exactly like using Notion, but it outputs a pixel-perfect PDF. The AI helped me rewrite my scattered bullet points into a highly professional executive summary."
  },
  {
    name: "Michael Chen",
    role: "Senior Software Engineer",
    avatar: "M",
    color: "from-brand-primary to-brand-secondary",
    text: "Finally, a resume builder that doesn't fight against you when you try to move a text box 5 pixels to the left. The ATS optimization feature directly led to my latest interview."
  },
  {
    name: "Emily Rodriguez",
    role: "Marketing Director",
    avatar: "E",
    color: "from-pink-500 to-rose-500",
    text: "The premium templates look incredible, but what really blew me away was the live PDF rendering. It's incredibly fast and the glowing UI is a joy to use."
  }
];

export function Testimonials() {
  return (
    <section className="py-24 bg-app-bg relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-extrabold text-app-text mb-6"
          >
            Loved by professionals
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-app-text-secondary"
          >
            Join thousands of ambitious individuals building their careers.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="glass-card p-8 rounded-3xl flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className="w-4 h-4 fill-brand-warning text-brand-warning" />
                  ))}
                </div>
                <p className="text-app-text-secondary leading-relaxed mb-8">
                  "{testimonial.text}"
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${testimonial.color} flex items-center justify-center text-white font-bold`}>
                  {testimonial.avatar}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-app-text">{testimonial.name}</h4>
                  <p className="text-xs text-app-text-muted">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
