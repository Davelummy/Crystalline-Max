import React from 'react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, getDocs, where } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Users, Clock, MapPin, CheckCircle2, AlertCircle, Play, Calendar as CalendarIcon, Activity } from 'lucide-react';
import * as d3 from 'd3';

export const AdminDashboard: React.FC = () => {
  const [checkins, setCheckins] = React.useState<any[]>([]);
  const [employees, setEmployees] = React.useState<any[]>([]);
  const [activeServices, setActiveServices] = React.useState<any[]>([]);
  const [schedules, setSchedules] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const mapRef = React.useRef<SVGSVGElement>(null);

  React.useEffect(() => {
    const q = query(collection(db, 'checkins'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCheckins(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching checkins:", error);
    });

    // Mock Active Services
    setActiveServices([
      { id: '1', client: 'John Smith', service: 'Full Detailing', location: 'Salford Quays', status: 'In Progress', startTime: '10:00' },
      { id: '2', client: 'Sarah Jones', service: 'Office Clean', location: 'Spinningfields', status: 'In Progress', startTime: '11:30' },
    ]);

    // Mock Schedules
    setSchedules([
      { id: '1', client: 'Mike Ross', service: 'Home Clean', date: 'Tomorrow', time: '09:00', staff: 'Unassigned' },
      { id: '2', client: 'Rachel Zane', service: 'Exterior Wash', date: 'Tomorrow', time: '14:00', staff: 'Unassigned' },
    ]);

    const fetchEmployees = async () => {
      const q = query(collection(db, 'users'), where('role', '==', 'employee'));
      const snapshot = await getDocs(q);
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchEmployees();
    return () => unsubscribe();
  }, []);

  // D3 Map Effect
  React.useEffect(() => {
    if (!mapRef.current || loading) return;

    const svg = d3.select(mapRef.current);
    svg.selectAll("*").remove();

    const width = 400;
    const height = 300;

    // Simple Manchester Map Representation
    const projection = d3.geoMercator()
      .center([-2.2426, 53.4808]) // Manchester center
      .scale(40000)
      .translate([width / 2, height / 2]);

    // Mock districts
    const districts = [
      { name: 'City Centre', coords: [-2.2426, 53.4808], active: true },
      { name: 'Salford', coords: [-2.2901, 53.4875], active: true },
      { name: 'Trafford', coords: [-2.3553, 53.4441], active: false },
      { name: 'Stockport', coords: [-2.1548, 53.4106], active: true },
    ];

    svg.selectAll("circle")
      .data(districts)
      .enter()
      .append("circle")
      .attr("cx", d => projection(d.coords as [number, number])![0])
      .attr("cy", d => projection(d.coords as [number, number])![1])
      .attr("r", d => d.active ? 15 : 10)
      .attr("fill", d => d.active ? "#00D1C1" : "#ffffff10")
      .attr("stroke", "#00D1C1")
      .attr("stroke-width", 1)
      .attr("opacity", 0.6);

    svg.selectAll("text")
      .data(districts)
      .enter()
      .append("text")
      .attr("x", d => projection(d.coords as [number, number])![0])
      .attr("y", d => projection(d.coords as [number, number])![1] + 25)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "8px")
      .attr("font-weight", "bold")
      .attr("class", "uppercase tracking-widest")
      .text(d => d.name);

  }, [loading]);

  if (loading) return <div className="pt-32 text-center">Loading Dashboard...</div>;

  return (
    <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl mb-4 font-display uppercase tracking-wider">Admin Control</h1>
          <p className="text-charcoal/60">Oversee employee activity, service performance, and coverage.</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-[10px] text-white/40 uppercase tracking-widest">System Status</p>
            <p className="text-teal font-bold uppercase tracking-widest flex items-center gap-2">
              <Activity size={12} /> Operational
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Map */}
        <div className="lg:col-span-1 space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="dark-card p-6">
              <div className="flex items-center gap-4 mb-4">
                <Users className="text-teal" size={20} />
                <h2 className="text-xs font-display uppercase tracking-widest">Staff</h2>
              </div>
              <p className="text-3xl font-bold">{employees.length}</p>
            </div>
            <div className="dark-card p-6">
              <div className="flex items-center gap-4 mb-4">
                <Play className="text-teal" size={20} />
                <h2 className="text-xs font-display uppercase tracking-widest">Live</h2>
              </div>
              <p className="text-3xl font-bold">{activeServices.length}</p>
            </div>
          </div>

          <div className="dark-card p-6">
            <h2 className="text-xs font-display uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Area Coverage Map</h2>
            <div className="bg-black/20 rounded-lg p-4 flex items-center justify-center">
              <svg ref={mapRef} width="100%" height="300" viewBox="0 0 400 300" />
            </div>
            <div className="mt-4 flex justify-between text-[8px] uppercase tracking-[0.2em] text-white/40">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal" /> Active Zone
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white/10 border border-teal" /> Expansion Zone
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: Services in Progress & Schedules */}
        <div className="lg:col-span-1 space-y-8">
          <div className="dark-card p-6">
            <h2 className="text-xs font-display uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Services In Progress</h2>
            <div className="space-y-4">
              {activeServices.map(service => (
                <div key={service.id} className="p-4 rounded bg-white/5 border border-white/5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-widest">{service.client}</h3>
                    <span className="text-[8px] bg-teal/20 text-teal px-2 py-1 rounded uppercase font-bold">Active</span>
                  </div>
                  <p className="text-[10px] text-white/60 uppercase tracking-widest mb-1">{service.service}</p>
                  <div className="flex items-center gap-2 text-[8px] text-white/40 uppercase tracking-widest">
                    <MapPin size={10} /> {service.location}
                    <Clock size={10} className="ml-2" /> Started {service.startTime}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dark-card p-6">
            <h2 className="text-xs font-display uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Booking Schedules</h2>
            <div className="space-y-4">
              {schedules.map(item => (
                <div key={item.id} className="p-4 rounded bg-white/5 border border-white/5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-widest">{item.client}</h3>
                    <div className="flex items-center gap-1 text-[8px] text-white/40 uppercase tracking-widest">
                      <CalendarIcon size={10} /> {item.date}
                    </div>
                  </div>
                  <p className="text-[10px] text-white/60 uppercase tracking-widest mb-1">{item.service}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] text-teal uppercase tracking-widest font-bold">{item.time}</span>
                    <span className="text-[8px] text-white/20 uppercase tracking-widest">{item.staff}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Feed */}
        <div className="lg:col-span-1">
          <div className="dark-card p-6 min-h-[600px]">
            <h2 className="text-xs font-display uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Live Activity Feed</h2>
            <div className="space-y-4">
              {checkins.length === 0 ? (
                <div className="text-center py-20 text-white/40">
                  <AlertCircle className="mx-auto mb-4 opacity-20" size={32} />
                  <p className="uppercase tracking-widest text-[8px]">No activity logged yet</p>
                </div>
              ) : (
                checkins.slice(0, 8).map((c) => (
                  <motion.div 
                    key={c.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3 p-3 rounded bg-white/5 border border-white/5"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${c.type === 'in' ? 'bg-teal' : 'bg-red-500'}`} />
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider">
                          {c.employeeName || 'Unknown'}
                        </h3>
                        <span className="text-[8px] text-white/40 uppercase tracking-widest">
                          {c.timestamp?.toDate ? c.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[8px] text-white/40 uppercase tracking-widest mt-0.5">
                        Checked {c.type === 'in' ? 'In' : 'Out'}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
