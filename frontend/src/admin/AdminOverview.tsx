import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, CartesianGrid
} from 'recharts';
import { Video, Users, BrainCircuit, Star, TrendingUp, Trophy, AlertTriangle, Clock, Plus, UserPlus, FileText, Settings, Activity, Server, Database, CheckCircle2, Calendar } from 'lucide-react';

const sparklineData1 = [{ v: 30 }, { v: 45 }, { v: 35 }, { v: 50 }, { v: 40 }, { v: 60 }, { v: 55 }];
const sparklineData2 = [{ v: 20 }, { v: 35 }, { v: 25 }, { v: 45 }, { v: 30 }, { v: 55 }, { v: 50 }];
const sparklineData3 = [{ v: 40 }, { v: 30 }, { v: 50 }, { v: 35 }, { v: 55 }, { v: 45 }, { v: 60 }];
const sparklineData4 = [{ v: 60 }, { v: 50 }, { v: 70 }, { v: 65 }, { v: 80 }, { v: 75 }, { v: 85 }];

const areaData = [
  { name: 'May 14', value: 80 }, { name: 'May 15', value: 120 },
  { name: 'May 16', value: 100 }, { name: 'May 17', value: 186 },
  { name: 'May 18', value: 140 }, { name: 'May 19', value: 130 },
  { name: 'May 20', value: 170 }
];

const pieData = [
  { name: 'Computer Science', value: 512, color: '#3B82F6', percent: '41%' },
  { name: 'Information Tech', value: 256, color: '#8B5CF6', percent: '21%' },
  { name: 'Electronics', value: 192, color: '#F59E0B', percent: '15%' },
  { name: 'Mechanical', value: 128, color: '#10B981', percent: '10%' },
  { name: 'Business Admin', value: 96, color: '#0EA5E9', percent: '8%' },
  { name: 'Others', value: 64, color: '#64748B', percent: '5%' }
];

const upcomingInterviews = [
  { name: 'Rahul Sharma', role: 'B.Tech CSE', time: 'Today, 10:00 AM', type: 'AI + Technical' },
  { name: 'Priya Patel', role: 'MCA', time: 'Today, 11:30 AM', type: 'AI + HR' },
  { name: 'Arjun Mehta', role: 'B.Tech IT', time: 'Today, 01:00 PM', type: 'AI + Technical' },
  { name: 'Sneha Roy', role: 'BBA', time: 'Today, 02:30 PM', type: 'AI + HR' },
  { name: 'Vikram Singh', role: 'B.Tech ECE', time: 'Today, 04:00 PM', type: 'AI + Technical' }
];

const radarData = [
  { subject: 'Technical Knowledge', A: 80, B: 60, fullMark: 100 },
  { subject: 'Problem Solving', A: 85, B: 65, fullMark: 100 },
  { subject: 'Confidence', A: 70, B: 75, fullMark: 100 },
  { subject: 'Attitude', A: 75, B: 70, fullMark: 100 },
  { subject: 'Domain Knowledge', A: 90, B: 80, fullMark: 100 },
  { subject: 'Communication', A: 85, B: 80, fullMark: 100 },
];

const barData = [
  { name: '0-20', value: 5, fill: '#EF4444' },
  { name: '21-40', value: 10, fill: '#F97316' },
  { name: '41-60', value: 20, fill: '#F59E0B' },
  { name: '61-80', value: 35, fill: '#10B981' },
  { name: '81-100', value: 30, fill: '#14B8A6' }
];

const Card = ({ children, style = {} }: any) => (
  <div style={{ backgroundColor: '#111827', border: '1px solid #1E293B', borderRadius: '1rem', padding: '1.5rem', ...style }}>
    {children}
  </div>
);

export default function AdminOverview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: '#FFFFFF', paddingBottom: '2rem' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Welcome back, Admin <span style={{ fontSize: '1.25rem' }}>👋</span></h1>
          <p style={{ color: '#94A3B8', margin: 0, fontSize: '0.9rem' }}>Here's what's happening with your smart campus AI interview system today.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#111827', border: '1px solid #1E293B', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', color: '#CBD5E1', cursor: 'pointer' }}>
          <span>May 20 – May 26, 2024</span>
          <Calendar size={14} color="#64748B" />
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        <Card style={{ position: 'relative', overflow: 'hidden', paddingBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <p style={{ color: '#94A3B8', fontSize: '0.8rem', margin: '0 0 0.5rem 0' }}>Total Interviews</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>1,248</h2>
                <span style={{ color: '#10B981', fontSize: '0.75rem', fontWeight: 600 }}>↑ 18.6%</span>
              </div>
              <p style={{ color: '#64748B', fontSize: '0.7rem', margin: '0.25rem 0 0 0' }}>vs May 13 - May 19</p>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', backgroundColor: '#1E3A8A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Video size={20} color="#60A5FA" />
            </div>
          </div>
          <div style={{ height: '50px', width: '100%', marginLeft: '-1.5rem', marginRight: '-1.5rem', marginBottom: '-1rem' }}>
            <ResponsiveContainer width="115%" height="100%">
              <AreaChart data={sparklineData1}>
                <defs>
                  <linearGradient id="colorSpark1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorSpark1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card style={{ position: 'relative', overflow: 'hidden', paddingBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <p style={{ color: '#94A3B8', fontSize: '0.8rem', margin: '0 0 0.5rem 0' }}>Candidates</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>2,539</h2>
                <span style={{ color: '#10B981', fontSize: '0.75rem', fontWeight: 600 }}>↑ 21.4%</span>
              </div>
              <p style={{ color: '#64748B', fontSize: '0.7rem', margin: '0.25rem 0 0 0' }}>vs May 13 - May 19</p>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', backgroundColor: '#064E3B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} color="#34D399" />
            </div>
          </div>
          <div style={{ height: '50px', width: '100%', marginLeft: '-1.5rem', marginRight: '-1.5rem', marginBottom: '-1rem' }}>
            <ResponsiveContainer width="115%" height="100%">
              <AreaChart data={sparklineData2}>
                <defs>
                  <linearGradient id="colorSpark2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorSpark2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card style={{ position: 'relative', overflow: 'hidden', paddingBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <p style={{ color: '#94A3B8', fontSize: '0.8rem', margin: '0 0 0.5rem 0' }}>AI Evaluations</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>1,186</h2>
                <span style={{ color: '#10B981', fontSize: '0.75rem', fontWeight: 600 }}>↑ 20.7%</span>
              </div>
              <p style={{ color: '#64748B', fontSize: '0.7rem', margin: '0.25rem 0 0 0' }}>vs May 13 - May 19</p>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', backgroundColor: '#4C1D95', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BrainCircuit size={20} color="#A78BFA" />
            </div>
          </div>
          <div style={{ height: '50px', width: '100%', marginLeft: '-1.5rem', marginRight: '-1.5rem', marginBottom: '-1rem' }}>
            <ResponsiveContainer width="115%" height="100%">
              <AreaChart data={sparklineData3}>
                <defs>
                  <linearGradient id="colorSpark3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorSpark3)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card style={{ position: 'relative', overflow: 'hidden', paddingBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <p style={{ color: '#94A3B8', fontSize: '0.8rem', margin: '0 0 0.5rem 0' }}>Avg. Score</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>76.8<span style={{ fontSize: '1rem', color: '#64748B' }}>/100</span></h2>
                <span style={{ color: '#10B981', fontSize: '0.75rem', fontWeight: 600 }}>↑ 4.3%</span>
              </div>
              <p style={{ color: '#64748B', fontSize: '0.7rem', margin: '0.25rem 0 0 0' }}>vs May 13 - May 19</p>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', backgroundColor: '#78350F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Star size={20} color="#FBBF24" />
            </div>
          </div>
          <div style={{ height: '50px', width: '100%', marginLeft: '-1.5rem', marginRight: '-1.5rem', marginBottom: '-1rem' }}>
            <ResponsiveContainer width="115%" height="100%">
              <AreaChart data={sparklineData4}>
                <defs>
                  <linearGradient id="colorSpark4" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorSpark4)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Main Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1.5rem' }}>
        
        {/* Area Chart */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>Interviews Over Time</h3>
            <div style={{ backgroundColor: '#1E293B', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
              Daily <span>˅</span>
            </div>
          </div>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dx={-10} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '0.5rem', color: '#FFF', fontSize: '0.8rem' }}
                  itemStyle={{ color: '#3B82F6' }}
                />
                <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorArea)" activeDot={{ r: 6, fill: '#3B82F6', stroke: '#111827', strokeWidth: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Donut Chart */}
        <Card>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: '0 0 1.5rem 0' }}>Interviews by Department</h3>
          <div style={{ display: 'flex', alignItems: 'center', height: '200px' }}>
            <div style={{ width: '50%', height: '100%', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#FFF' }}>1,248</h4>
                <p style={{ margin: 0, fontSize: '0.65rem', color: '#64748B' }}>Total</p>
              </div>
            </div>
            <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {pieData.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: d.color }}></div>
                    <span style={{ color: '#94A3B8' }}>{d.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{d.value}</span>
                    <span style={{ color: '#64748B' }}>({d.percent})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'right', marginTop: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#3B82F6', cursor: 'pointer', fontWeight: 500 }}>View full report →</span>
          </div>
        </Card>

        {/* Upcoming Interviews */}
        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>Upcoming Interviews</h3>
            <span style={{ fontSize: '0.75rem', color: '#3B82F6', cursor: 'pointer' }}>View All</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            {upcomingInterviews.map((u, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img src={`https://ui-avatars.com/api/?name=${u.name.replace(' ', '+')}&background=random`} alt={u.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                  <div>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 600, margin: 0, color: '#E2E8F0' }}>{u.name}</h4>
                    <p style={{ fontSize: '0.7rem', color: '#64748B', margin: 0 }}>{u.role}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.75rem', color: '#E2E8F0', margin: 0 }}>{u.time}</p>
                  <p style={{ fontSize: '0.7rem', color: '#3B82F6', margin: 0, display: 'flex', alignItems: 'center', gap: '0.2rem', justifyContent: 'flex-end' }}>
                    <BrainCircuit size={10} /> {u.type}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'right', marginTop: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#3B82F6', cursor: 'pointer', fontWeight: 500 }}>View Calendar →</span>
          </div>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
        
        {/* Radar Chart */}
        <Card>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: '0 0 1rem 0' }}>AI Evaluation Summary</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '12px', height: '2px', backgroundColor: '#3B82F6' }}></div> This Week
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '12px', height: '2px', backgroundColor: '#64748B', borderStyle: 'dashed' }}></div> Last Week
            </div>
          </div>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#1E293B" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="This Week" dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                <Radar name="Last Week" dataKey="B" stroke="#64748B" strokeDasharray="3 3" fill="transparent" />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Bar Chart */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>Candidate Performance Distribution</h3>
            <div style={{ backgroundColor: '#1E293B', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
              Score Range <span>˅</span>
            </div>
          </div>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} tickFormatter={(val) => `${val}%`} dx={-10} />
                <RechartsTooltip cursor={{ fill: '#1E293B', opacity: 0.4 }} contentStyle={{ backgroundColor: '#111827', border: '1px solid #1E293B', color: '#FFF' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* AI Insights */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>AI Insights</h3>
            <span style={{ fontSize: '0.75rem', color: '#3B82F6', cursor: 'pointer', padding: '0.2rem 0.5rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.25rem' }}>View All</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <TrendingUp size={18} color="#10B981" style={{ marginTop: '2px' }} />
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#CBD5E1', lineHeight: 1.5 }}>Communication skills are improving by 12% compared to last week.</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <Trophy size={18} color="#F59E0B" style={{ marginTop: '2px' }} />
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#CBD5E1', lineHeight: 1.5 }}>Problem solving scores are the highest among all evaluation metrics.</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <AlertTriangle size={18} color="#F97316" style={{ marginTop: '2px' }} />
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#CBD5E1', lineHeight: 1.5 }}>32% of candidates need improvement in domain knowledge.</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <Clock size={18} color="#3B82F6" style={{ marginTop: '2px' }} />
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#CBD5E1', lineHeight: 1.5 }}>Peak interview time is between 10 AM - 2 PM.</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Footer Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr', gap: '1.5rem' }}>
        
        {/* Quick Actions */}
        <Card>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: '0 0 1rem 0' }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'transparent', border: '1px solid #1E293B', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', color: '#CBD5E1', fontSize: '0.75rem', cursor: 'pointer' }}>
              <Plus size={14} /> Schedule Interview
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'transparent', border: '1px solid #1E293B', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', color: '#CBD5E1', fontSize: '0.75rem', cursor: 'pointer' }}>
              <UserPlus size={14} /> Add Candidate
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'transparent', border: '1px solid #1E293B', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', color: '#CBD5E1', fontSize: '0.75rem', cursor: 'pointer' }}>
              <FileText size={14} /> Generate Report
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'transparent', border: '1px solid #1E293B', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', color: '#CBD5E1', fontSize: '0.75rem', cursor: 'pointer' }}>
              <BrainCircuit size={14} /> AI Evaluation Rules
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'transparent', border: '1px solid #1E293B', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', color: '#CBD5E1', fontSize: '0.75rem', cursor: 'pointer' }}>
              <Settings size={14} /> System Settings
            </button>
          </div>
        </Card>

        {/* System Status */}
        <Card>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: '0 0 1rem 0' }}>System Status</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94A3B8' }}><BrainCircuit size={14} /> AI Service</div>
              <div style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }}></div> Operational</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94A3B8' }}><Video size={14} /> Video Service</div>
              <div style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }}></div> Operational</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94A3B8' }}><Database size={14} /> Database</div>
              <div style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }}></div> Operational</div>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>Recent Activity</h3>
            <span style={{ fontSize: '0.75rem', color: '#3B82F6', cursor: 'pointer', padding: '0.2rem 0.5rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.25rem' }}>View All</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '0.4rem', borderRadius: '50%' }}>
              <CheckCircle2 size={16} color="#10B981" />
            </div>
            <div>
              <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: '#CBD5E1' }}>AI evaluation completed for Rahul Sharma</p>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B' }}>2 min ago</p>
            </div>
          </div>
        </Card>
      </div>

    </div>
  );
}
