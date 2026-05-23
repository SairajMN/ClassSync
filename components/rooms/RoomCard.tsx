'use client';

import { MouseEvent } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Room } from '@/types';
import { 
  Tv, 
  Users, 
  MapPin, 
  Sparkles, 
  Cpu, 
  Wind,
  Layers,
  ChevronRight,
  MonitorPlay,
  Mic,
  Wifi
} from 'lucide-react';
import Link from 'next/link';

interface RoomCardProps {
  room: Room;
}

export default function RoomCard({ room }: RoomCardProps) {
  // Motion values for pointer coordinates relative to card bounds
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Map coordinates into rotation angles for 3D tilt
  const rotateX = useTransform(y, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-15, 15]);

  // Specular reflection gradient mapping coordinates
  const shineX = useTransform(x, [-0.5, 0.5], ['0%', '100%']);
  const shineY = useTransform(y, [-0.5, 0.5], ['0%', '100%']);

  // Apply smooth springs so tilts do not snap jitterily
  const springConfig = { damping: 25, stiffness: 200, mass: 0.8 };
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Normalize coordinates between -0.5 and 0.5
    const relativeX = (event.clientX - rect.left) / width - 0.5;
    const relativeY = (event.clientY - rect.top) / height - 0.5;

    x.set(relativeX);
    y.set(relativeY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Helper to map room type to icon and gradient accent
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'smart_room':
        return { icon: Cpu, accent: 'from-purple-500 to-indigo-500', name: 'Smart Room', text: 'text-purple-400' };
      case 'lab':
        return { icon: Layers, accent: 'from-emerald-500 to-teal-500', name: 'Laboratory', text: 'text-emerald-400' };
      case 'seminar_hall':
        return { icon: Sparkles, accent: 'from-amber-500 to-orange-500', name: 'Seminar Hall', text: 'text-amber-400' };
      default:
        return { icon: Tv, accent: 'from-blue-500 to-indigo-500', name: 'Classroom', text: 'text-blue-400' };
    }
  };

  // Helper to map resource icon
  const getResourceIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('projector')) return MonitorPlay;
    if (lower.includes('smart board') || lower.includes('board')) return Tv;
    if (lower.includes('mic') || lower.includes('microphone')) return Mic;
    if (lower.includes('internet') || lower.includes('wifi')) return Wifi;
    if (lower.includes('ac') || lower.includes('condition')) return Wind;
    return Cpu;
  };

  const config = getTypeConfig(room.room_type);
  const TypeIcon = config.icon;

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformStyle: 'preserve-3d',
      }}
      className="perspective-1000 group relative flex h-[350px] w-full flex-col justify-between rounded-2xl glass-panel p-6 border-violet-500/10 cursor-pointer transition-all duration-300"
    >
      {/* Specular Glare / Glass Shimmer Light reflection */}
      <motion.div
        style={{
          background: `radial-gradient(circle 120px at ${shineX} ${shineY}, rgba(255,255,255,0.12), transparent 80%)`,
        }}
        className="pointer-events-none absolute inset-0 rounded-2xl"
      />

      <div style={{ transform: 'translateZ(50px)' }} className="preserve-3d space-y-4">
        {/* Card Header Type Banner & Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr ${config.accent} shadow-lg shadow-violet-500/10`}>
              <TypeIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Resource Area</p>
              <h3 className="text-sm font-bold text-white leading-tight">{config.name}</h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.08)]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[9px] font-bold uppercase text-emerald-400">Available</span>
          </div>
        </div>

        {/* Room Title */}
        <div className="pt-2">
          <h2 className="font-display text-2xl font-bold tracking-tight text-white group-hover:text-violet-400 transition-colors">
            {room.name}
          </h2>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-medium">
            <MapPin className="h-3.5 w-3.5 text-violet-500" />
            {room.building || 'Main Campus'}, Floor {room.floor ?? 0}
          </p>
        </div>

        {/* Room Capacity Detail */}
        <div className="flex items-center gap-2 rounded-xl bg-white/5 p-3 border border-white/5">
          <Users className="h-5 w-5 text-slate-400" />
          <div>
            <span className="text-[9px] font-bold uppercase text-slate-500">Room Capacity</span>
            <p className="text-sm font-bold text-white">{room.capacity} Attendees</p>
          </div>
        </div>
      </div>

      <div style={{ transform: 'translateZ(30px)' }} className="preserve-3d space-y-4">
        {/* Resources Badges List */}
        <div className="space-y-1">
          <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Housed Resources</span>
          <div className="flex flex-wrap gap-1.5">
            {room.room_resources && room.room_resources.length > 0 ? (
              room.room_resources.map((rr) => {
                const resName = rr.resources?.name || 'Equipment';
                const ResIcon = getResourceIcon(resName);
                return (
                  <div
                    key={rr.id}
                    className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[10px] font-medium text-slate-300 border border-white/5 hover:border-violet-500/20 hover:bg-violet-600/5 transition-all"
                  >
                    <ResIcon className="h-3 w-3 text-violet-400" />
                    <span>{resName}</span>
                    <span className="rounded bg-violet-600/20 px-1 text-[9px] font-bold text-violet-300">
                      x{rr.quantity}
                    </span>
                  </div>
                );
              })
            ) : (
              <span className="text-[10px] text-slate-500 italic">No assigned resources.</span>
            )}
          </div>
        </div>

        {/* Direct Link Action button */}
        <Link href={`/bookings/new?room_id=${room.id}`}>
          <div className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-600/20 hover:from-violet-500 hover:to-indigo-500 transition-all duration-300 group-hover:scale-[1.02]">
            <span>Configure Reservation</span>
            <ChevronRight className="h-4 w-4 text-white/80 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </div>
    </motion.div>
  );
}
