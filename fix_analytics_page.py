with open('frontend/src/admin/pages/AnalyticsPage.tsx', 'r') as f:
    text = f.read()

# Replace timeRangeOpen dropdown items rendering styles
old_range_rendering = """              {['Last 30 Days', 'Last 6 Months', 'Last Year', 'All Time'].map(range => (
                <div key={range} onClick={() => { setTimeRange(range); setTimeRangeOpen(false); showToast(`Data filtered by ${range}`, 'success'); }} style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#334155', cursor: 'pointer', textAlign: 'left', borderRadius: '0.25rem' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#475569'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  {range}
                </div>
              ))}"""

new_range_rendering = """              {['Last 30 Days', 'Last 6 Months', 'Last Year', 'All Time'].map(range => (
                <div key={range} onClick={() => { setTimeRange(range); setTimeRangeOpen(false); showToast(`Data filtered by ${range}`, 'success'); }} style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#0F172A', fontWeight: 800, cursor: 'pointer', textAlign: 'left', borderRadius: '0.25rem', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  {range}
                </div>
              ))}"""

text = text.replace(old_range_rendering, new_range_rendering)

new_return_block = """  if (loading) return <div style={{ color: '#0F172A', padding: '2rem', fontWeight: 800 }}>Loading analytics...</div>;

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Analytics Overview</h2>
          <p style={{ fontSize: '0.85rem', color: '#1E293B', margin: '0.25rem 0 0 0' }}>Deep dive into AI evaluation metrics, hiring velocity, and skill gaps.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
          <button onClick={() => setTimeRangeOpen(!timeRangeOpen)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#FFFFFF', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}>
            <Calendar size={16} color="#E11D48" />
            {timeRange}
          </button>
          {timeRangeOpen && (
            <div style={{ position: 'absolute', top: '100%', left: '0', marginTop: '0.5rem', backgroundColor: '#FAF6EE', border: '2px solid #0F172A', borderRadius: '0.5rem', padding: '0.25rem', zIndex: 10, minWidth: '150px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}>
              {['Last 30 Days', 'Last 6 Months', 'Last Year', 'All Time'].map(range => (
                <div key={range} onClick={() => { setTimeRange(range); setTimeRangeOpen(false); showToast(`Data filtered by ${range}`, 'success'); }} style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#0F172A', fontWeight: 800, cursor: 'pointer', textAlign: 'left', borderRadius: '0.25rem', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  {range}
                </div>
              ))}
            </div>
          )}
          <button onClick={() => {
            const csvData = "Metric,Value\\nAverage AI Score," + (stats?.avg_final_score || 0) + "%\\nTotal Interviews," + (stats?.total_interviews || 0) + "\\nTotal Candidates," + (stats?.total_students || 0) + "\\n\\nDepartment,Applications,Hired\\n" + (stats?.department_hiring || []).map((d: any) => `${d.name},${d.applied},${d.hired}`).join('\\n');
            const blob = new Blob([csvData], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('href', url);
            a.setAttribute('download', `Analytics_Report_${timeRange.replace(/ /g, '_')}.csv`);
            a.click();
            showToast('Detailed Report exported successfully!', 'success');
          }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#E11D48', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)' }}>
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Top Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        {[
          { title: 'Average AI Evaluation Score', value: stats?.avg_final_score || '0', trend: '+4.2%', icon: TrendingUp, color: '#E11D48' },
          { title: 'Total Interviews', value: stats?.total_interviews || '0', trend: '+18.6%', icon: Calendar, color: '#10B981' },
          { title: 'Total Candidates', value: stats?.total_students || '0', trend: '+21.4%', icon: TrendingUp, color: '#8B5CF6' }
        ].map((stat, i) => (
          <div key={i} style={{ backgroundColor: '#FAF6EE', padding: '1.5rem', borderRadius: '1rem', border: '2px solid #0F172A' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <p style={{ color: '#1E293B', fontSize: '0.85rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>{stat.title}</p>
                <h3 style={{ color: '#0F172A', fontSize: '2rem', fontWeight: 800, margin: 0 }}>{stat.value}</h3>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: `${stat.color}15`, borderRadius: '0.75rem', border: '2px solid #0F172A' }}>
                <stat.icon size={24} color={stat.color} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ color: stat.trend.startsWith('+') ? '#22C55E' : '#22C55E', fontWeight: 800 }}>{stat.trend}</span>
              <span style={{ color: '#1E293B', fontWeight: 700 }}>vs previous period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Performance Trend */}
        <div style={{ backgroundColor: '#FAF6EE', padding: '1.5rem', borderRadius: '1rem', border: '2px solid #0F172A' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: '0 0 1.5rem 0' }}>Candidate Performance Trends</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.performance_data || []}>
                <defs>
                  <linearGradient id="colorTech" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E11D48" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#E11D48" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#0F172A" fontSize={12} tickLine={false} axisLine={false} style={{ fontWeight: 700 }} />
                <YAxis stroke="#0F172A" fontSize={12} tickLine={false} axisLine={false} style={{ fontWeight: 700 }} />
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <Tooltip contentStyle={{ backgroundColor: '#FAF6EE', borderColor: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', color: '#0F172A', fontWeight: 800 }} />
                <Legend />
                <Area type="monotone" dataKey="tech" name="Tech Scores" stroke="#E11D48" strokeWidth={3} fillOpacity={1} fill="url(#colorTech)" />
                <Area type="monotone" dataKey="hr" name="HR Scores" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorHr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill Gaps */}
        <div style={{ backgroundColor: '#FAF6EE', padding: '1.5rem', borderRadius: '1rem', border: '2px solid #0F172A' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: '0 0 1.5rem 0' }}>Sought-After Skills</h3>
          <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.skill_gap_data || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {(stats?.skill_gap_data || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#FAF6EE', borderColor: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', color: '#0F172A', fontWeight: 800 }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div style={{ backgroundColor: '#FAF6EE', padding: '1.5rem', borderRadius: '1rem', border: '2px solid #0F172A' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: '0 0 1.5rem 0' }}>Hiring Pipeline by Department</h3>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.department_hiring || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="name" stroke="#0F172A" fontSize={12} tickLine={false} axisLine={false} style={{ fontWeight: 700 }} />
              <YAxis yAxisId="left" orientation="left" stroke="#0F172A" fontSize={12} tickLine={false} axisLine={false} style={{ fontWeight: 700 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#10B981" fontSize={12} tickLine={false} axisLine={false} style={{ fontWeight: 700 }} />
              <Tooltip cursor={{fill: 'rgba(225, 29, 72, 0.05)'}} contentStyle={{ backgroundColor: '#FAF6EE', borderColor: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', color: '#0F172A', fontWeight: 800 }} />
              <Legend />
              <Bar yAxisId="left" dataKey="applied" name="Total Applications" fill="#E11D48" radius={[4, 4, 0, 0]} maxBarSize={50} />
              <Bar yAxisId="right" dataKey="hired" name="Candidates Hired" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );"""

start_idx = text.find("if (loading)")
if start_idx != -1:
    text = text[:start_idx] + new_return_block + "\n}"

with open('frontend/src/admin/pages/AnalyticsPage.tsx', 'w') as f:
    f.write(text)
