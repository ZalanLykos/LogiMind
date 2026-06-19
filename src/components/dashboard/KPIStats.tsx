import { Package, DollarSign, TrendingUp, Truck, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';
import { calculateKPIs, formatCurrency, formatNumber, getStatusColor } from '../../utils/dashboardUtils';
import type { DailyRecord } from '../../types';

interface KPIStatsProps {
  records: DailyRecord[];
}

interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  statusColor: string;
  trend?: 'up' | 'down' | 'neutral';
}

function KPICard({ title, value, subtitle, icon, statusColor, trend }: KPICardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
              {trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
              {subtitle}
            </span>
          </div>
        </div>
        <div className={`p-3 rounded-lg ${statusColor.split(' ')[1] || 'bg-gray-50'}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function KPIStats({ records }: KPIStatsProps) {
  const kpis = calculateKPIs(records);

  const fulfillmentStatus = getStatusColor(kpis.fulfillmentRate, 'fulfillment');
  const marginStatus = getStatusColor(kpis.profitMargin, 'margin');

  const cards: KPICardProps[] = [
    {
      title: 'Total Orders',
      value: formatNumber(kpis.totalOrders),
      subtitle: 'Units processed',
      icon: <Package className="w-5 h-5 text-blue-600" />,
      statusColor: 'text-blue-600 bg-blue-50',
      trend: 'up'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(kpis.totalRevenue),
      subtitle: `${kpis.profitMargin.toFixed(1)}% margin`,
      icon: <DollarSign className="w-5 h-5 text-green-600" />,
      statusColor: marginStatus.color,
      trend: kpis.profitMargin > 15 ? 'up' : 'neutral'
    },
    {
      title: 'Total Cost',
      value: formatCurrency(kpis.totalCost),
      subtitle: 'Operational costs',
      icon: <BarChart3 className="w-5 h-5 text-red-600" />,
      statusColor: 'text-red-600 bg-red-50'
    },
    {
      title: 'Fulfillment Rate',
      value: `${kpis.fulfillmentRate.toFixed(1)}%`,
      subtitle: kpis.fulfillmentRate >= 95 ? 'Excellent' : kpis.fulfillmentRate >= 90 ? 'Good' : 'Needs Attention',
      icon: <CheckCircle className={`w-5 h-5 ${kpis.fulfillmentRate >= 95 ? 'text-green-600' : kpis.fulfillmentRate >= 90 ? 'text-yellow-600' : 'text-red-600'}`} />,
      statusColor: fulfillmentStatus.color
    },
    {
      title: 'Active Shipments',
      value: formatNumber(kpis.activeShipments),
      subtitle: 'In transit',
      icon: <Truck className="w-5 h-5 text-indigo-600" />,
      statusColor: 'text-indigo-600 bg-indigo-50'
    },
    {
      title: 'Stockout Incidents',
      value: formatNumber(kpis.stockoutDays),
      subtitle: kpis.stockoutDays === 0 ? 'No issues' : kpis.stockoutDays < 10 ? 'Minor issues' : 'Critical',
      icon: <AlertTriangle className={`w-5 h-5 ${kpis.stockoutDays === 0 ? 'text-green-600' : kpis.stockoutDays < 10 ? 'text-yellow-600' : 'text-red-600'}`} />,
      statusColor: kpis.stockoutDays === 0 ? 'text-green-600 bg-green-50' : kpis.stockoutDays < 10 ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <KPICard key={index} {...card} />
      ))}
    </div>
  );
}