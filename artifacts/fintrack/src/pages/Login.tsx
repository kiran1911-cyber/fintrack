import { useAuth } from "@workspace/replit-auth-web";
import { Wallet, ArrowRight, ShieldCheck, Zap, PieChart } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      {/* Background Image / Effects */}
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/login-bg.png`} 
          alt="Abstract financial background" 
          className="w-full h-full object-cover opacity-30 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background/50" />
      </div>

      <div className="relative z-10 container max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
        
        {/* Left Col - Copy */}
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-xl text-center lg:text-left mx-auto lg:mx-0"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Meet Your AI Financial Advisor
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-display font-bold text-foreground leading-[1.1] tracking-tight mb-6">
            Master your wealth with <span className="text-gradient">FinTrack AI</span>
          </h1>
          
          <p className="text-lg lg:text-xl text-muted-foreground mb-10 leading-relaxed max-w-lg mx-auto lg:mx-0">
            Intelligent expense tracking meets personalized investment advice. Take control of your financial future today.
          </p>

          <div className="grid sm:grid-cols-2 gap-6 mb-12 text-left">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <PieChart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Smart Analytics</h3>
                <p className="text-sm text-muted-foreground">Beautiful charts and insights into your spending habits.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">AI Advisor</h3>
                <p className="text-sm text-muted-foreground">Personalized portfolio recommendations instantly.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Col - Auth Card */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="mx-auto w-full max-w-md"
        >
          <div className="bg-glass p-8 sm:p-10 rounded-[2rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-colors duration-500" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/50 p-0.5 shadow-xl shadow-primary/20 mb-8">
                <div className="w-full h-full bg-background rounded-[14px] flex items-center justify-center">
                  <Wallet className="w-10 h-10 text-primary" />
                </div>
              </div>

              <h2 className="text-3xl font-display font-bold text-foreground mb-3">Welcome Back</h2>
              <p className="text-muted-foreground mb-10">Sign in to securely access your financial dashboard.</p>

              <button 
                onClick={() => login()}
                className="w-full relative group overflow-hidden rounded-xl bg-primary text-primary-foreground font-semibold text-lg p-0.5 transition-all hover:scale-[1.02] active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative px-6 py-4 flex items-center justify-center gap-2">
                  Continue securely
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground justify-center">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Protected by Replit Auth
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
