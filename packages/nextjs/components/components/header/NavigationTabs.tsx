import { motion } from "motion/react";
import { Home, PieChart, TrendingUp, Users, User } from "lucide-react";

interface NavigationItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  gradient: string;
  defaultColor: string;
  hoverColor: string;
}

interface NavigationTabsProps {
  shouldShowWalletNavigation: boolean;
  activeTab: string;
  activeWalletTab: string;
  handleNavClick: (tab: any) => void;
  handleWalletNavClick: (tab: any) => void;
}

export function NavigationTabs({
  shouldShowWalletNavigation,
  activeTab,
  activeWalletTab,
  handleNavClick,
  handleWalletNavClick
}: NavigationTabsProps) {
  // Wallet navigation items with custom styling
  const walletNavItems: NavigationItem[] = [
    { 
      id: 'home', 
      label: 'Home', 
      icon: <Home className="w-4 h-4" />,
      gradient: 'from-teal-400 to-cyan-500',
      defaultColor: 'text-teal-500 dark:text-teal-400',
      hoverColor: 'hover:text-teal-600 dark:hover:text-teal-300'
    },
    { 
      id: 'portfolio', 
      label: 'Portfolio', 
      icon: <PieChart className="w-4 h-4" />,
      gradient: 'from-blue-400 to-indigo-500',
      defaultColor: 'text-blue-500 dark:text-blue-400',
      hoverColor: 'hover:text-blue-600 dark:hover:text-blue-300'
    },
    { 
      id: 'trade', 
      label: 'Trade', 
      icon: <TrendingUp className="w-4 h-4" />,
      gradient: 'from-emerald-400 to-teal-500',
      defaultColor: 'text-emerald-500 dark:text-emerald-400',
      hoverColor: 'hover:text-emerald-600 dark:hover:text-emerald-300'
    },
    { 
      id: 'social', 
      label: 'Social', 
      icon: <Users className="w-4 h-4" />,
      gradient: 'from-purple-400 to-violet-500',
      defaultColor: 'text-purple-500 dark:text-purple-400',
      hoverColor: 'hover:text-purple-600 dark:hover:text-purple-300'
    },
    { 
      id: 'profile', 
      label: 'Profile', 
      icon: <User className="w-4 h-4" />,
      gradient: 'from-pink-400 to-rose-500',
      defaultColor: 'text-pink-500 dark:text-pink-400',
      hoverColor: 'hover:text-pink-600 dark:hover:text-pink-300'
    }
  ];

  // Regular navigation items with custom styling
  const regularNavItems: NavigationItem[] = [
    {
      id: 'about',
      label: 'About',
      gradient: 'from-teal-400 to-cyan-500',
      defaultColor: 'text-teal-500 dark:text-teal-400',
      hoverColor: 'hover:text-teal-600 dark:hover:text-teal-300'
    },
    {
      id: 'rebalance',
      label: 'Rebalance',
      gradient: 'from-blue-400 to-indigo-500',
      defaultColor: 'text-blue-500 dark:text-blue-400',
      hoverColor: 'hover:text-blue-600 dark:hover:text-blue-300'
    },
    {
      id: 'top-performers',
      label: 'Top Performers',
      gradient: 'from-emerald-400 to-teal-500',
      defaultColor: 'text-emerald-500 dark:text-emerald-400',
      hoverColor: 'hover:text-emerald-600 dark:hover:text-emerald-300'
    }
  ];

  if (shouldShowWalletNavigation) {
    return (
      <>
        {walletNavItems.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => handleWalletNavClick(item.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm lg:text-base transition-all duration-300 rounded-lg relative overflow-hidden group ${
              activeWalletTab === item.id
                ? 'text-white shadow-lg transform scale-105'
                : `${item.defaultColor} ${item.hoverColor} hover:scale-102`
            }`}
            style={{
              background: activeWalletTab === item.id 
                ? `linear-gradient(135deg, var(--gradient-primary))` 
                : 'transparent'
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Active gradient background */}
            {activeWalletTab === item.id && (
              <motion.div
                className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-90`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.9 }}
                transition={{ duration: 0.3 }}
              />
            )}
            
            {/* Hover gradient background with glow */}
            <motion.div
              className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-20`}
              transition={{ duration: 0.3 }}
            />
            
            {/* Subtle glow effect for non-active tabs */}
            {activeWalletTab !== item.id && (
              <motion.div
                className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-5 blur-xl`}
                transition={{ duration: 0.3 }}
              />
            )}
            
            {/* Content */}
            <div className="relative z-10 flex items-center gap-2">
              {item.icon}
              {item.label}
            </div>
            
            {/* Active underline with gradient */}
            {activeWalletTab === item.id && (
              <motion.div
                className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${item.gradient}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </motion.button>
        ))}
      </>
    );
  }

  return (
    <>
      {regularNavItems.map((item) => (
        <motion.button
          key={item.id}
          onClick={() => handleNavClick(item.id as any)}
          className={`px-4 py-2 text-sm lg:text-base transition-all duration-300 rounded-lg relative overflow-hidden group ${
            activeTab === item.id
              ? 'text-white shadow-lg transform scale-105'
              : `${item.defaultColor} ${item.hoverColor} hover:scale-102`
          }`}
          style={{
            background: activeTab === item.id 
              ? `linear-gradient(135deg, var(--gradient-primary))` 
              : 'transparent'
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Active gradient background */}
          {activeTab === item.id && (
            <motion.div
              className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-90`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              transition={{ duration: 0.3 }}
            />
          )}
          
          {/* Hover gradient background with glow */}
          <motion.div
            className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-20`}
            transition={{ duration: 0.3 }}
          />
          
          {/* Subtle glow effect for non-active tabs */}
          {activeTab !== item.id && (
            <motion.div
              className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-5 blur-xl`}
              transition={{ duration: 0.3 }}
            />
          )}
          
          {/* Content */}
          <div className="relative z-10">
            {item.label}
          </div>
          
          {/* Active underline with gradient */}
          {activeTab === item.id && (
            <motion.div
              className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${item.gradient}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </motion.button>
      ))}
    </>
  );
}