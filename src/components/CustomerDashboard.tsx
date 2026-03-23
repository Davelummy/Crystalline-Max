import React from 'react';
import { Calendar, Clock, MapPin, Star, Repeat, ChevronRight, User } from 'lucide-react';

interface CustomerDashboardProps {
  onNavigate: (view: any) => void;
  user: any;
  userData: any;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onNavigate, user, userData }) => {
  return (
    <div className="min-h-screen bg-silver/10 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-teal text-xs tracking-widest mb-2 uppercase">Welcome Back</h2>
            <h3 className="text-3xl uppercase">{userData?.displayName || user?.displayName || 'Valued Client'}</h3>
          </div>
          <div className="text-right">
            <p className="text-xs text-charcoal/40 uppercase font-bold">Loyalty Status</p>
            <p className="text-2xl font-display text-teal">
              {userData?.bookingCount === 0 ? '10% OFF NEXT' : 
               userData?.bookingCount >= 3 ? '5% OFF ACTIVE' : 
               `${3 - (userData?.bookingCount || 0)} TO 5% OFF`}
            </p>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="md:col-span-2 space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-charcoal/40">Upcoming Booking</h4>
            <div className="dark-card p-8 relative overflow-hidden">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-teal text-xs font-bold uppercase tracking-widest mb-2">Car Detailing - Crystalline Package</p>
                  <p className="text-3xl font-display uppercase">Tomorrow, 14:00</p>
                </div>
                <button onClick={() => onNavigate('booking')} className="btn-primary py-2 px-4 text-xs">RESCHEDULE</button>
              </div>
              <div className="flex gap-8 text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-teal" /> M1 4BT, Manchester
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-teal" /> 2.5 Hours Est.
                </div>
              </div>
            </div>

            <h4 className="text-sm font-bold uppercase tracking-widest text-charcoal/40 pt-6">Past Services</h4>
            <div className="space-y-3">
              {[
                { date: '12 Mar 2026', service: 'Home Cleaning', price: '£45' },
                { date: '01 Feb 2026', service: 'Car Detailing', price: '£85' },
              ].map((item, idx) => (
                <div key={idx} onClick={() => onNavigate('billing')} className="frost-card-light p-4 flex justify-between items-center hover:bg-white transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-charcoal/5 rounded-lg flex items-center justify-center">
                      <Calendar size={18} className="text-charcoal/40" />
                    </div>
                    <div>
                      <p className="font-bold text-sm uppercase">{item.service}</p>
                      <p className="text-[10px] text-charcoal/40 uppercase">{item.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-sm font-bold">{item.price}</span>
                    <ChevronRight size={16} className="text-charcoal/20" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-charcoal/40">Quick Actions</h4>
            <button onClick={() => onNavigate('booking')} className="w-full btn-primary flex items-center justify-center gap-2 py-6">
              <Repeat size={18} /> REBOOK LAST SERVICE
            </button>
            <button onClick={() => onNavigate('profile')} className="w-full btn-secondary flex items-center justify-center gap-2 py-6 border-charcoal/10 hover:border-teal/50">
              <User size={18} /> EDIT PROFILE
            </button>
            
            <div className="frost-card-light p-6">
              <h5 className="text-xs font-bold uppercase tracking-widest mb-4">Your Detailing Specialist</h5>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-charcoal/10 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <p className="font-bold text-sm uppercase">Marcus Thorne</p>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => <Star key={i} size={10} className="fill-teal text-teal" />)}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-charcoal/40 uppercase leading-relaxed">
                Marcus has completed 12 services for you with a 100% satisfaction rate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
