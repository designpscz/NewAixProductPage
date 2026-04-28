import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-6 bg-gray-100 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 mt-auto transition-colors">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          이 앱은 (주)푸시컴즈의 AIXSTUDIO의 지침으로 만들어졌습니다.
        </p>
      </div>
    </footer>
  );
};

export default Footer;