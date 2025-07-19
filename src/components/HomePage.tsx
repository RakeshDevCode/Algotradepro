import React from 'react';
import { TrendingUp, Shield, Zap, BarChart3, ArrowRight, Play } from 'lucide-react';

interface HomePageProps {
  onGetStarted: () => void;
  onShowAuth: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onGetStarted, onShowAuth }) => {
  const features = [
    {
      icon: TrendingUp,
      title: 'Real-time Trading',
      description: 'Execute trades with lightning-fast speed using Dhan API integration'
    },
    {
      icon: Shield,
      title: 'Risk Management',
      description: 'Advanced risk controls and position sizing to protect your capital'
    },
    {
      icon: Zap,
      title: 'Algorithmic Strategies',
      description: 'Deploy sophisticated trading algorithms with automated execution'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description: 'Comprehensive portfolio analytics and performance tracking'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white overflow-hidden">
      <button  onClick={onShowAuth} className="p-2 px-4  rounded-lg text-white  hover:underline text-xl  font-bold mt-8 ml-[70%] bg-blue-500"
>
  Login
</button>
      {/* Hero Section */}
      <div className="relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
          <div className="absolute top-40 left-1/2 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            {/* Main heading with animation */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
                Welcome to
              </span>
              <br />
              <span className="text-white">AlgoTrade Pro</span>
            </h1>
            
            {/* Tagline */}
            <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto animate-fade-in-up animation-delay-500">
              Unleash the power of algorithmic trading with advanced strategies, 
              real-time market data, and intelligent automation
            </p>
            
            {/* Subtitle */}<p>            
            <a className="text-lg  mb-8 p-1 md:p-2 text-gray-100 bg-gradient-to-r from-yellow-600 to-purple-600 rounded-full hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300"
  href="https://github.com/rakeshdevcode" 
  target="_blank" 
  rel="noopener noreferrer"
>
 Professional-grade trading platform powered by rakeshdevcode
</a>    </p>


            

            
            {/* CTA Button */}
            <div className="animate-fade-in-up animation-delay-1500">
              <div className="flex flex-col sm:flex-row gap-4 justify-center my-12">
                <button
                  onClick={onShowAuth}
                  className="group relative inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-blue-500/25"
                >
                  <Play className="w-5 h-5 mr-3 group-hover:animate-pulse" />
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                  
                  {/* Animated border */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"></div>
                </button>
                
                <button
                  onClick={onGetStarted}
                  className="group relative inline-flex items-center px-8 py-4 text-lg font-semibold text-blue-600 bg-white rounded-full hover:bg-gray-50 transform hover:scale-105 transition-all duration-300 shadow-2xl border-2 border-blue-600"
                >
                  <BarChart3 className="w-5 h-5 mr-3" />
                  View Demo
                  <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Choose AlgoTrade Pro?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Experience next-generation trading with cutting-edge technology and professional-grade tools
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 hover:bg-gray-800/70 transition-all duration-300 hover:transform hover:scale-105 border border-gray-700/50 hover:border-blue-500/50"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
                
                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative py-16 bg-gray-800/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="animate-fade-in-up">
              <div className="text-4xl font-bold text-blue-400 mb-2">99.9%</div>
              <div className="text-gray-400">Uptime Reliability</div>
            </div>
            <div className="animate-fade-in-up animation-delay-300">
              <div className="text-4xl font-bold text-green-400 mb-2">&lt;10ms</div>
              <div className="text-gray-400">Order Execution</div>
            </div>
            <div className="animate-fade-in-up animation-delay-600">
              <div className="text-4xl font-bold text-purple-400 mb-2">24/7</div>
              <div className="text-gray-400">Market Monitoring</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;