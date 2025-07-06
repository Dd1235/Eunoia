import * as React from 'react';

interface AccordionItem {
  title: string;
  content: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  defaultOpen?: number;
}

export const Accordion: React.FC<AccordionProps> = ({ items, defaultOpen = 0 }) => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(defaultOpen);

  return (
    <div className='rounded-xl border border-gray-200 bg-white/80 shadow-sm dark:border-gray-800 dark:bg-gray-900/60'>
      {items.map((item, idx) => (
        <div key={idx} className='border-b border-gray-200 last:border-b-0 dark:border-gray-800'>
          <button
            className={`flex w-full items-center justify-between px-6 py-4 text-left text-lg font-medium transition-colors focus:outline-none ${
              openIndex === idx
                ? 'bg-gray-100 text-blue-700 dark:bg-gray-800 dark:text-blue-300'
                : 'bg-transparent text-gray-900 dark:text-gray-100'
            }`}
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
            aria-expanded={openIndex === idx}
            aria-controls={`accordion-content-${idx}`}
          >
            <span>{item.title}</span>
            <span className={`ml-2 transition-transform ${openIndex === idx ? 'rotate-90' : ''}`}>▶</span>
          </button>
          <div
            id={`accordion-content-${idx}`}
            className={`overflow-hidden transition-all duration-300 ${openIndex === idx ? 'max-h-96 px-6 py-4' : 'max-h-0 px-6 py-0'}`}
            style={{}}
            aria-hidden={openIndex !== idx}
          >
            {openIndex === idx && <div className='text-gray-700 dark:text-gray-300'>{item.content}</div>}
          </div>
        </div>
      ))}
    </div>
  );
};
