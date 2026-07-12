import { 
  Package, CheckCircle2, ClipboardList, AlertTriangle, 
  ArrowRightLeft, Wrench, MoreHorizontal, TrendingUp, Calendar
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { motion } from 'framer-motion';

const stats = [
  { name: 'Total Assets', value: '1,245', icon: Package, color: 'text-primary', bg: 'bg-primary/10', trend: '+12.5%' },
  { name: 'Available', value: '850', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: '+4.2%' },
  { name: 'Allocated', value: '342', icon: ClipboardList, color: 'text-indigo-500', bg: 'bg-indigo-500/10', trend: '-2.1%' },
  { name: 'Maintenance', value: '28', icon: Wrench, color: 'text-amber-500', bg: 'bg-amber-500/10', trend: '+1.5%' },
];

const areaData = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 500 },
  { name: 'Apr', value: 280 },
  { name: 'May', value: 590 },
  { name: 'Jun', value: 800 },
  { name: 'Jul', value: 950 },
];

const barData = [
  { name: 'Engineering', active: 400, inactive: 240 },
  { name: 'Design', active: 300, inactive: 139 },
  { name: 'Marketing', active: 200, inactive: 980 },
  { name: 'HR', active: 278, inactive: 390 },
  { name: 'Sales', active: 189, inactive: 480 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function Dashboard() {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Real-time metrics for your organization.</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 rounded-lg border border-border bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors">
            <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
            Last 30 Days
          </button>
          <button className="px-4 py-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <motion.div 
            key={stat.name} 
            variants={itemVariants}
            className="bg-card rounded-xl p-5 shadow-soft hover:shadow-soft-hover transition-all duration-300 border border-border flex flex-col justify-between group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color} ring-1 ring-inset ring-border/50`}>
                <stat.icon className="w-6 h-6 stroke-[2]" aria-hidden="true" />
              </div>
              <button className="text-muted-foreground hover:text-foreground p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground tracking-tight">{stat.value}</p>
              <p className="text-sm font-medium text-muted-foreground mt-1">{stat.name}</p>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <span className={`font-semibold flex items-center ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                {stat.trend.startsWith('+') ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingUp className="w-3.5 h-3.5 mr-1 transform rotate-180" />}
                {stat.trend}
              </span>
              <span className="text-muted-foreground ml-2">vs last month</span>
            </div>
          </motion.div>
        ))}
      </motion.div>
      
      {/* Charts Grid */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main Chart */}
        <motion.div 
          variants={itemVariants}
          className="bg-card rounded-xl shadow-soft border border-border p-6 lg:col-span-3"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Asset Value (YTD)</h3>
              <p className="text-xs text-muted-foreground mt-1">Acquisition value minus depreciation</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Secondary Chart */}
        <motion.div 
          variants={itemVariants}
          className="bg-card rounded-xl shadow-soft border border-border p-6 lg:col-span-2 flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-semibold text-foreground">Allocations</h3>
          </div>
          <div className="h-64 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} width={80} />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{ borderRadius: '8px', backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="active" stackId="a" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={16} />
                <Bar dataKey="inactive" stackId="a" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </motion.div>

      {/* Activity & Notifications */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Activity */}
        <motion.div 
          variants={itemVariants}
          className="bg-card rounded-xl shadow-soft border border-border flex flex-col"
        >
          <div className="p-5 border-b border-border flex justify-between items-center">
            <h3 className="text-base font-semibold text-foreground">Activity Log</h3>
            <button className="text-xs text-primary font-medium hover:underline">View All</button>
          </div>
          <div className="p-5">
            <div className="space-y-5">
              {[
                { time: '2h ago', icon: ArrowRightLeft, color: 'text-purple-500 bg-purple-500/10', user: 'Sarah Connor', action: 'transferred', item: 'Sony A7IV Camera' },
                { time: '4h ago', icon: ClipboardList, color: 'text-blue-500 bg-blue-500/10', user: 'Admin', action: 'allocated', item: 'MacBook Pro M2' },
                { time: '1d ago', icon: Wrench, color: 'text-amber-500 bg-amber-500/10', user: 'John Doe', action: 'reported damage on', item: 'Ford Transit Van' },
              ].map((activity, i) => (
                <div key={i} className="flex items-start">
                  <div className={`p-2 rounded-lg ${activity.color} shrink-0`}>
                    <activity.icon className="w-4 h-4" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">{activity.user}</span> {activity.action} <span className="font-medium text-primary">{activity.item}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Notifications / Alerts */}
        <motion.div 
          variants={itemVariants}
          className="bg-card rounded-xl shadow-soft border border-border flex flex-col"
        >
          <div className="p-5 border-b border-border flex justify-between items-center">
            <h3 className="text-base font-semibold text-foreground">Action Needed</h3>
            <span className="bg-destructive/10 text-destructive text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded">3 Pending</span>
          </div>
          <div className="p-5 space-y-3">
            {[
              { type: 'Transfer Approval', desc: 'Sony A7IV requested by Marketing', tag: 'High Priority' },
              { type: 'Maintenance Review', desc: 'Projector bulb replacement (Room A)', tag: 'Medium' },
            ].map((alert, i) => (
              <div key={i} className="p-4 rounded-lg border border-border bg-background hover:bg-muted transition-colors cursor-pointer flex justify-between items-center group">
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{alert.type}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{alert.desc}</p>
                </div>
                <div className="shrink-0">
                  <span className="px-2 py-1 rounded text-[10px] font-medium text-muted-foreground border border-border bg-background">
                    {alert.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </motion.div>
    </motion.div>
  );
}
