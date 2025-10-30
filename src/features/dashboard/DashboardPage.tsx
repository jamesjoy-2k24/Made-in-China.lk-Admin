import React from 'react';
import { ShoppingCart, DollarSign, Users, AlertTriangle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

// -----------------------------
// Helpers
// -----------------------------
const formatLKR = (value: number) =>
  `LKR ${value.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;
const formatNum = (n: number) => n.toLocaleString();

// -----------------------------
// Mock Data
// -----------------------------
const salesData = [
  { name: 'Jan', sales: 480000, orders: 240 },
  { name: 'Feb', sales: 380000, orders: 180 },
  { name: 'Mar', sales: 550000, orders: 310 },
  { name: 'Apr', sales: 610000, orders: 350 },
  { name: 'May', sales: 720000, orders: 400 },
  { name: 'Jun', sales: 690000, orders: 370 },
];

const categoryData = [
  { name: 'Electronics', value: 420000 },
  { name: 'Fashion', value: 300000 },
  { name: 'Home & Living', value: 180000 },
  { name: 'Sports', value: 120000 },
];

// -----------------------------
// KPI Card Component
// -----------------------------
const KPICard: React.FC<{
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
}> = ({ title, value, change, changeType, icon: Icon }) => {
  const changeColor =
    changeType === 'positive'
      ? 'text-green-500'
      : changeType === 'negative'
      ? 'text-primary-500'
      : 'text-gray-400';

  return (
    <div className='bg-white dark:bg-darkSurface-elevated rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all'>
      <div className='flex items-center justify-between'>
        <div className='flex flex-col'>
          <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
            {title}
          </p>
          <p className='text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1'>
            {value}
          </p>
          <p className={`text-sm mt-1 ${changeColor}`}>
            {change}{' '}
            <span className='text-gray-500 dark:text-gray-400'>
              vs last month
            </span>
          </p>
        </div>
        <div className='p-3 rounded-lg bg-primary-50 dark:bg-primary-500/10'>
          <Icon className='h-6 w-6 text-primary-600 dark:text-primary-400' />
        </div>
      </div>
    </div>
  );
};

// -----------------------------
// Dashboard Page
// -----------------------------
const DashboardPage: React.FC = () => {
  return (
    <div className='min-h-screen bg-black dark:bg-darkSurface p-6 space-y-8 transition-colors'>
      {/* Header */}
      <header>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight'>
          Dashboard
        </h1>
        <p className='text-gray-600 dark:text-gray-400 mt-1'>
          Welcome back! Here’s an overview of your business performance.
        </p>
      </header>

      {/* KPI Cards */}
      <section>
        <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'>
          <KPICard
            title='Total Revenue'
            value={formatLKR(3250000)}
            change='+12.8%'
            changeType='positive'
            icon={DollarSign}
          />
          <KPICard
            title='Total Orders'
            value={formatNum(1289)}
            change='+9.2%'
            changeType='positive'
            icon={ShoppingCart}
          />
          <KPICard
            title='New Customers'
            value={formatNum(98)}
            change='+6.4%'
            changeType='positive'
            icon={Users}
          />
          <KPICard
            title='Low Stock Items'
            value={formatNum(18)}
            change='+4 items'
            changeType='negative'
            icon={AlertTriangle}
          />
        </div>
      </section>

      {/* Charts Section */}
      <section className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Sales Overview */}
        <div className='bg-white dark:bg-darkSurface-elevated border border-gray-100 dark:border-gray-700 rounded-xl p-6 shadow-sm'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
            Monthly Sales (LKR)
          </h3>
          <ResponsiveContainer
            width='100%'
            height={300}
          >
            <LineChart data={salesData}>
              <CartesianGrid
                strokeDasharray='3 3'
                stroke='#555'
                opacity={0.2}
              />
              <XAxis
                dataKey='name'
                stroke='#888'
              />
              <YAxis stroke='#888' />
              <Tooltip
                formatter={(value, name) =>
                  name === 'sales'
                    ? [formatLKR(value as number), 'Sales']
                    : [formatNum(value as number), 'Orders']
                }
              />
              <Line
                type='monotone'
                dataKey='sales'
                stroke='#ee1c25'
                strokeWidth={2}
              />
              <Line
                type='monotone'
                dataKey='orders'
                stroke='#10B981'
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution (Bar instead of Pie) */}
        <div className='bg-white dark:bg-darkSurface-elevated border border-gray-100 dark:border-gray-700 rounded-xl p-6 shadow-sm'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
            Sales by Category
          </h3>
          <ResponsiveContainer
            width='100%'
            height={300}
          >
            <BarChart data={categoryData}>
              <CartesianGrid
                strokeDasharray='3 3'
                stroke='#555'
                opacity={0.2}
              />
              <XAxis
                dataKey='name'
                stroke='#888'
              />
              <YAxis />
              <Tooltip formatter={(v) => formatLKR(v as number)} />
              <Bar
                dataKey='value'
                radius={[6, 6, 0, 0]}
              >
                {categoryData.map((entry, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={['#ee1c25', '#F97316', '#0EA5E9', '#10B981'][i % 4]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Tables Section */}
      <section className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Recent Orders */}
        <div className='bg-white dark:bg-darkSurface-elevated border border-gray-100 dark:border-gray-700 rounded-xl p-6 shadow-sm'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
            Recent Orders
          </h3>
          <ul className='divide-y divide-gray-200 dark:divide-gray-700'>
            {[1, 2, 3, 4, 5].map((o) => (
              <li
                key={o}
                className='py-4 flex justify-between items-center'
              >
                <div>
                  <p className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                    Order #ORD-2025-{String(o).padStart(5, '0')}
                  </p>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    Customer {o} • 2 items
                  </p>
                </div>
                <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'>
                  Paid
                </span>
              </li>
            ))}
          </ul>
          <button className='w-full mt-5 py-2 rounded-md text-sm font-medium text-white bg-primary-500 hover:bg-primary-600'>
            View All Orders
          </button>
        </div>

        {/* Low Stock */}
        <div className='bg-white dark:bg-darkSurface-elevated border border-gray-100 dark:border-gray-700 rounded-xl p-6 shadow-sm'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
            Low Stock Products
          </h3>
          <ul className='divide-y divide-gray-200 dark:divide-gray-700'>
            {[
              { name: 'Smartphone X Pro', stock: 5 },
              { name: 'Ergonomic Chair', stock: 3 },
              { name: 'Wireless Mouse', stock: 2 },
              { name: 'Sports Watch', stock: 4 },
            ].map((p, i) => (
              <li
                key={i}
                className='py-4 flex justify-between items-center'
              >
                <div>
                  <p className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                    {p.name}
                  </p>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    {p.stock} units left
                  </p>
                </div>
                <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400'>
                  Low Stock
                </span>
              </li>
            ))}
          </ul>
          <button className='w-full mt-5 py-2 rounded-md text-sm font-medium text-white bg-primary-500 hover:bg-primary-600'>
            Manage Inventory
          </button>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
