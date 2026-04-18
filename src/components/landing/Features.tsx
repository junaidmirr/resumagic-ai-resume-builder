import { Bot, CheckCircle2, Layout, FileSearch, Zap, Share2 } from 'lucide-react';

const features = [
  {
    name: 'AI-Powered Writing',
    description: 'Overcome writer\'s block. Our AI generates impactful bullet points tailored to your industry and role.',
    icon: Bot,
    color: 'text-indigo-500 dark:text-indigo-400',
    bgColor: 'bg-indigo-500/10 dark:bg-indigo-500/20',
  },
  {
    name: 'ATS-Friendly Templates',
    description: 'Our beautifully designed templates are rigorously tested to pass Applicant Tracking Systems.',
    icon: Layout,
    color: 'text-teal-500 dark:text-teal-400',
    bgColor: 'bg-teal-500/10 dark:bg-teal-500/20',
  },
  {
    name: 'Keyword Optimization',
    description: 'Analyze job descriptions and automatically insert the missing keywords to get you noticed.',
    icon: FileSearch,
    color: 'text-cyan-500 dark:text-cyan-400',
    bgColor: 'bg-cyan-500/10 dark:bg-cyan-500/20',
  },
  {
    name: 'Lightning Fast',
    description: 'Go from blank page to a hired-ready resume in less than 15 minutes with our intelligent wizard.',
    icon: Zap,
    color: 'text-emerald-500 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20',
  },
  {
    name: 'Real-time Analytics',
    description: 'Get an instant score on your resume\'s strength, readability, and impact as you build it.',
    icon: CheckCircle2,
    color: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-500/10 dark:bg-blue-500/20',
  },
  {
    name: 'Easy Export & Share',
    description: 'Download as a pixel-perfect PDF, or share a live web link directly with recruiters and managers.',
    icon: Share2,
    color: 'text-violet-500 dark:text-violet-400',
    bgColor: 'bg-violet-500/10 dark:bg-violet-500/20',
  },
];

export function Features() {
  return (
    <div id="features" className="py-24 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-teal-600 dark:text-teal-400">Build Better, Faster</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Everything you need to land the interview
          </p>
          <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
            ResuMagic.AI combines beautiful design with powerful artificial intelligence to give you an unfair advantage in the job market.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <dt className="flex items-center gap-x-4 text-lg font-semibold leading-7 text-slate-900 dark:text-white">
                  <div className={`rounded-xl p-3 ${feature.bgColor} transition-transform duration-300 group-hover:scale-110`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-6 flex flex-auto flex-col text-base leading-7 text-slate-600 dark:text-slate-400">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
