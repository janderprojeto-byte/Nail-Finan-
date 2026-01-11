
import React, { useMemo, useState } from 'react';
import { Transaction, Revenue, PaymentMethod } from '../types';
import { formatCurrency, getMonthName, SUB_CATEGORY_LABELS, generateMonthlyExpenses, getMonthlyRevenues } from '../utils';
import { 
  Calendar, TrendingUp, DollarSign, Activity, PieChart, Info, 
  Smartphone, CreditCard, Banknote, ShieldCheck, Target, Scissors,
  ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

interface ChartsViewProps {
  allTransactions: Transaction[];
  allRevenues: Revenue[];
  currentMonth: number;
  currentYear: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const ChartsView: React.FC<ChartsViewProps> = ({
  allTransactions,
  allRevenues,
  currentMonth,
  currentYear,
  onPrevMonth,
  onNextMonth
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const expenses = useMemo(() => 
    generateMonthlyExpenses(allTransactions, currentMonth, currentYear),
    [allTransactions, currentMonth, currentYear]
  );

  const revenues = useMemo(() => 
    getMonthlyRevenues(allRevenues, currentMonth, currentYear),
    [allRevenues, currentMonth, currentYear]
  );

  const profExpenses = expenses.filter(e => e.type === 'PROFESSIONAL');
  const totalProf = profExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalFixedProf = profExpenses.filter(e => e.category === 'FIXED').reduce((acc, curr) => acc + curr.amount, 0);
  const totalRevenue = revenues.reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = totalRevenue - totalProf;

  const trendData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const m = date.getMonth();
      const y = date.getFullYear();
      const mExpenses = generateMonthlyExpenses(allTransactions, m, y);
      const mRevenues = getMonthlyRevenues(allRevenues, m, y);
      const totalExpProf = mExpenses.filter(e => e.type === 'PROFESSIONAL').reduce((acc, curr) => acc + curr.amount, 0);
      const totalRev = mRevenues.reduce((acc, curr) => acc + curr.amount, 0);
      data.push({
        label: getMonthName(m).substring(0, 3),
        expense: totalExpProf,
        revenue: totalRev,
        profit: totalRev - totalExpProf
      });
    }
    return data;
  }, [allTransactions, allRevenues, currentMonth, currentYear]);

  const maxValue = Math.max(...trendData.flatMap(d => [d.expense, d.revenue]), 1);

  const revenueByMethod = useMemo(() => {
    const agg: Record<PaymentMethod, number> = { PIX: 0, CARD: 0, CASH: 0 };
    revenues.forEach(r => {
      agg[r.paymentMethod] = (agg[r.paymentMethod] || 0) + r.amount;
    });
    return agg;
  }, [revenues]);

  const profBySub = useMemo(() => {
    const agg: Record<string, number> = {};
    profExpenses.forEach(e => {
      agg[e.subCategory] = (agg[e.subCategory] || 0) + e.amount;
    });
    return Object.entries(agg)
      .sort(([, a], [, b]) => b - a)
      .map(([key, value]) => ({ label: SUB_CATEGORY_LABELS[key] || key, value }));
  }, [profExpenses]);

  // SVG Chart Config
  const chartHeight = 160;
  const chartWidth = 500;
  
  const getX = (i: number) => (i / (trendData.length - 1)) * chartWidth;
  const getY = (val: number) => chartHeight - (val / maxValue) * chartHeight;

  const revenuePath = trendData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.revenue)}`).join(' ');
  const expensePath = trendData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.expense)}`).join(' ');

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Date Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-[32px] shadow-sm border border-gray-100">
        <button onClick={onPrevMonth} className="p-3 hover:bg-vibrantPink-50 text-vibrantPink-500 rounded-2xl transition-all active:scale-95">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
            <h2 className="text-lg font-black text-gray-800 tracking-tight">Análise de Performance</h2>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{getMonthName(currentMonth)} {currentYear}</p>
        </div>
        <button onClick={onNextMonth} className="p-3 hover:bg-vibrantPink-50 text-vibrantPink-500 rounded-2xl transition-all active:scale-95">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 group hover:border-emerald-200 transition-all">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><ShieldCheck size={24} /></div>
                <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                   {netProfit >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>} 
                   {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Margem de Lucro</h4>
              <p className="text-3xl font-black text-gray-800 tracking-tighter">
                {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(0) : 0}%
              </p>
          </div>

          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 group hover:border-vibrantPink-200 transition-all">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-vibrantPink-50 text-vibrantPink-600 rounded-2xl"><Target size={24} /></div>
              </div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Custo Fixo (Meta)</h4>
              <p className="text-3xl font-black text-gray-800 tracking-tighter">{formatCurrency(totalFixedProf)}</p>
          </div>

          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 group hover:border-sky-200 transition-all">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl"><Activity size={24} /></div>
              </div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Eficiência de Caixa</h4>
              <p className="text-3xl font-black text-gray-800 tracking-tighter">
                {totalRevenue > 0 ? (100 - (totalProf / totalRevenue * 100)).toFixed(0) : 0}%
              </p>
          </div>
      </div>

      {/* Interactive Line Chart */}
      <div className="bg-white p-10 rounded-[48px] shadow-sm border border-gray-100 relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
            <div>
                <h3 className="text-xl font-black text-gray-800 tracking-tight">Evolução do Faturamento</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Últimos 6 Meses</p>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-500">
                <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-sm shadow-emerald-200"></div> Ganhos
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-vibrantPink-400">
                <div className="w-3 h-3 bg-vibrantPink-400 rounded-full shadow-sm shadow-vibrantPink-200"></div> Gastos
              </div>
            </div>
        </div>
        
        <div className="w-full h-[220px] relative mt-4">
          <svg 
            viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} 
            className="w-full h-full overflow-visible"
            onMouseLeave={() => setHoverIndex(null)}
          >
            {/* Horizontal Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((p) => (
              <line 
                key={p} 
                x1="0" y1={chartHeight * p} 
                x2={chartWidth} y2={chartHeight * p} 
                stroke="#f3f4f6" strokeWidth="1" 
              />
            ))}

            {/* Paths */}
            <path 
              d={revenuePath} 
              fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" 
              className="drop-shadow-[0_4px_8px_rgba(16,185,129,0.3)]"
            />
            <path 
              d={expensePath} 
              fill="none" stroke="#ff00ff" strokeWidth="3" strokeDasharray="8 6" strokeLinecap="round" 
              className="opacity-40"
            />

            {/* Interaction Layer */}
            {trendData.map((d, i) => {
              const x = getX(i);
              const isHovered = hoverIndex === i;
              
              return (
                <g key={i}>
                  {/* Vertical Guide */}
                  {isHovered && (
                    <line x1={x} y1="0" x2={x} y2={chartHeight} stroke="#ff00ff" strokeWidth="1" strokeDasharray="4 4" />
                  )}
                  
                  {/* Revenue Point */}
                  <circle 
                    cx={x} cy={getY(d.revenue)} r={isHovered ? 8 : 5} 
                    className={`fill-emerald-500 stroke-white stroke-2 transition-all duration-300 ${isHovered ? 'scale-125' : ''}`} 
                  />
                  
                  {/* Label */}
                  <text 
                    x={x} y={chartHeight + 30} 
                    className={`text-[11px] font-black uppercase transition-colors duration-300 ${isHovered ? 'fill-vibrantPink-500' : 'fill-gray-300'}`} 
                    textAnchor="middle"
                  >
                    {d.label}
                  </text>

                  {/* Hit Area */}
                  <rect 
                    x={x - 20} y="0" width="40" height={chartHeight + 40} 
                    fill="transparent" className="cursor-pointer"
                    onMouseEnter={() => setHoverIndex(i)}
                  />
                </g>
              );
            })}
          </svg>

          {/* Tooltip Overlay */}
          {hoverIndex !== null && (
            <div 
              className="absolute top-0 pointer-events-none bg-gray-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-200 z-20"
              style={{ left: `${(hoverIndex / (trendData.length - 1)) * 90}%`, transform: 'translateX(-10%)' }}
            >
              <p className="text-[10px] font-black uppercase text-vibrantPink-400 mb-2">{getMonthName(currentMonth - (5 - hoverIndex))} {currentYear}</p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-6">
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Ganhos:</span>
                  <span className="text-xs font-black text-emerald-400">{formatCurrency(trendData[hoverIndex].revenue)}</span>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Custos:</span>
                  <span className="text-xs font-black text-vibrantPink-400">{formatCurrency(trendData[hoverIndex].expense)}</span>
                </div>
                <div className="pt-1.5 mt-1.5 border-t border-white/10 flex items-center justify-between gap-6">
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Lucro:</span>
                  <span className={`text-xs font-black ${trendData[hoverIndex].profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(trendData[hoverIndex].profit)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Payment Methods - Donut Chart */}
        <div className="bg-white p-10 rounded-[48px] shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-xl font-black text-gray-800 mb-8 tracking-tight">Canais de Recebimento</h3>
          
          <div className="flex flex-1 items-center justify-around gap-8">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {/* Simulated Donut segments based on percentages */}
                {(() => {
                  const total = Math.max(revenueByMethod.PIX + revenueByMethod.CARD + revenueByMethod.CASH, 1);
                  const pPix = (revenueByMethod.PIX / total) * 100;
                  const pCard = (revenueByMethod.CARD / total) * 100;
                  const pCash = (revenueByMethod.CASH / total) * 100;

                  let currentOffset = 0;
                  const segments = [
                    { p: pPix, color: '#0ea5e9' }, // Pix
                    { p: pCard, color: '#f97316' }, // Card
                    { p: pCash, color: '#10b981' }  // Cash
                  ];

                  return segments.map((s, i) => {
                    const strokeDash = `${s.p} ${100 - s.p}`;
                    const offset = -currentOffset;
                    currentOffset += s.p;
                    return (
                      <circle 
                        key={i} cx="50" cy="50" r="40" 
                        fill="none" stroke={s.color} strokeWidth="12" 
                        strokeDasharray={strokeDash} strokeDashoffset={offset}
                        className="transition-all duration-1000 ease-out"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[9px] font-black text-gray-400 uppercase">Total</p>
                <p className="text-sm font-black text-gray-800">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-sky-500"></div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pix</p>
                  <p className="text-sm font-black text-gray-800">{formatCurrency(revenueByMethod.PIX)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cartão</p>
                  <p className="text-sm font-black text-gray-800">{formatCurrency(revenueByMethod.CARD)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dinheiro</p>
                  <p className="text-sm font-black text-gray-800">{formatCurrency(revenueByMethod.CASH)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Expenses - Bar Chart */}
        <div className="bg-white p-10 rounded-[48px] shadow-sm border border-gray-100">
          <h3 className="text-xl font-black text-gray-800 mb-8 tracking-tight">Principais Gastos</h3>
          <div className="space-y-6">
            {profBySub.length === 0 ? (
              <div className="py-16 text-center text-gray-300 italic font-medium">Sem gastos registrados no Stúdio.</div>
            ) : profBySub.slice(0, 5).map((item, i) => (
              <div key={i} className="group">
                <div className="flex justify-between text-[10px] mb-2 font-black uppercase tracking-[0.15em]">
                  <span className="text-gray-400 group-hover:text-vibrantPink-600 transition-colors">{item.label}</span>
                  <span className="text-gray-800">{formatCurrency(item.value)}</span>
                </div>
                <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden border border-gray-100">
                  <div 
                    className="bg-gradient-to-r from-vibrantPink-400 to-vibrantPink-600 h-full rounded-full transition-all duration-1000 ease-out shadow-sm" 
                    style={{ width: `${(item.value / (totalProf || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          {profBySub.length > 5 && (
            <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-6">
              Exibindo os 5 maiores custos operacionais
            </p>
          )}
        </div>
      </div>
      
      {/* Dynamic Summary Card */}
      <div className="bg-gradient-to-br from-gray-900 via-vibrantPink-900 to-black p-10 rounded-[48px] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <PieChart size={120} />
          </div>
          <div className="relative z-10 text-center md:text-left">
              <h4 className="text-xl font-black tracking-tight mb-2">Insight de Gestão</h4>
              <p className="text-vibrantPink-200 text-xs leading-relaxed max-w-md">
                {netProfit > 0 
                  ? `Parabéns! Seu lucro de ${formatCurrency(netProfit)} representa uma excelente saúde financeira. Considere reinvestir parte desse valor em novos cursos.`
                  : `Atenção: Seus custos estão superando os ganhos em ${formatCurrency(Math.abs(netProfit))}. Revise seus gastos variáveis para equilibrar o caixa.`
                }
              </p>
          </div>
          <div className="shrink-0 relative z-10">
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-vibrantPink-300 mb-1">Resultado Líquido</p>
              <p className={`text-2xl font-black tracking-tighter ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(netProfit)}
              </p>
            </div>
          </div>
      </div>
    </div>
  );
};

export default ChartsView;
