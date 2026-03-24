import React from 'react';
import { motion } from 'motion/react';
import { Check, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SERVICES, CAR_ADDONS, HOME_ADDONS } from '../constants';

interface CostEstimatorProps {
  onBook?: (serviceId: string) => void;
}

export const CostEstimator: React.FC<CostEstimatorProps> = ({ onBook }) => {
  const [selectedService, setSelectedService] = React.useState(SERVICES[0]);
  const [selectedAddons, setSelectedAddons] = React.useState<string[]>([]);

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const currentAddons = selectedService.type === 'car' ? CAR_ADDONS : 
                        selectedService.type === 'home' ? HOME_ADDONS : [];

  const total = selectedService.basePrice + 
    selectedAddons.reduce((acc, id) => {
      const addon = currentAddons.find(a => a.id === id);
      return acc + (addon?.price || 0);
    }, 0);

  return (
    <div className="min-h-screen bg-charcoal pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-16">
          <h2 className="text-teal text-xs tracking-[0.4em] mb-4 uppercase">Instant Quote</h2>
          <h3 className="text-4xl md:text-5xl text-white">Service Cost Estimator</h3>
          <p className="text-white/40 mt-4 uppercase tracking-widest text-sm font-bold">Transparent pricing. No hidden fees.</p>
        </header>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Controls */}
          <div className="space-y-10">
            <section>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6">1. Select Service Type</h4>
              <div className="grid grid-cols-1 gap-4">
                {SERVICES.map(service => (
                  <button
                    key={service.id}
                    onClick={() => { setSelectedService(service); setSelectedAddons([]); }}
                    className={cn(
                      "flex items-center justify-between p-6 rounded-custom border transition-all",
                      selectedService.id === service.id 
                        ? "bg-teal border-teal text-charcoal" 
                        : "bg-white/5 border-white/10 text-white hover:border-teal/50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <service.icon size={24} />
                      <span className="font-display font-bold uppercase tracking-wider">{service.label}</span>
                    </div>
                    <span className="text-sm font-bold">Base: £{service.basePrice}</span>
                  </button>
                ))}
              </div>
            </section>

            {currentAddons.length > 0 && (
              <section>
                <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6">2. Add-on Enhancements</h4>
                <div className="grid grid-cols-1 gap-3">
                  {currentAddons.map(addon => (
                    <button
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-custom border transition-all",
                        selectedAddons.includes(addon.id)
                          ? "bg-white/10 border-teal text-teal"
                          : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-5 h-5 rounded-sm border flex items-center justify-center",
                          selectedAddons.includes(addon.id) ? "bg-teal border-teal" : "border-white/20"
                        )}>
                          {selectedAddons.includes(addon.id) && <Check size={12} className="text-charcoal" />}
                        </div>
                        <span className="text-sm font-medium uppercase tracking-wider">{addon.label}</span>
                      </div>
                      <span className="text-sm font-bold">+£{addon.price}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Summary */}
          <div className="lg:sticky lg:top-32 h-fit">
            <div className="dark-card p-8 border-teal/30 bg-gradient-to-br from-charcoal to-charcoal/80">
              <div className="flex items-center gap-3 mb-8">
                <Calculator className="text-teal" size={24} />
                <h4 className="text-xl font-display uppercase tracking-wider">Estimate Summary</h4>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-white/40 uppercase tracking-widest">Base Service</span>
                  <span className="text-white font-bold uppercase">{selectedService.label}</span>
                </div>
                {selectedAddons.map(id => {
                  const addon = currentAddons.find(a => a.id === id);
                  return (
                    <div key={id} className="flex justify-between text-sm">
                      <span className="text-white/40 uppercase tracking-widest">{addon?.label}</span>
                      <span className="text-white font-bold">+£{addon?.price}</span>
                    </div>
                  );
                })}
              </div>

              <hr className="border-white/10 mb-8" />

              <div className="flex justify-between items-end mb-10">
                <div>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Estimated Total</p>
                  <p className="text-5xl font-display text-teal">£{total}</p>
                </div>
                <p className="text-[10px] text-white/20 uppercase font-bold text-right max-w-[120px]">
                  Final price may vary based on vehicle size or property condition.
                </p>
              </div>

              <button 
                onClick={() => onBook?.(selectedService.id)}
                className="btn-primary w-full py-5 text-lg flex items-center justify-center gap-3 group"
              >
                BOOK THIS SERVICE
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Check size={20} />
                </motion.div>
              </button>
            </div>

            <div className="mt-6 glass-card p-6 border-white/5">
              <p className="text-xs text-white/40 leading-relaxed italic">
                "Crystalline Max provides the most transparent pricing in Manchester. The quote I got online was exactly what I paid at the door."
                <span className="block mt-2 font-bold not-italic text-teal">— David S., Salford</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
