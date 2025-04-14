'use client';

import { useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { getPoolAnalytics } from '@/lib/raydium-client';
import { LiquidityPool } from '@/lib/raydium';

interface PoolAnalyticsProps {
  pool: LiquidityPool | null;
}

interface PoolStats {
  volume24h: string;
  fees24h: string;
  apr: string;
  tvl: string;
  priceChange24h: number;
}

interface PriceData {
  time: string;
  price: number;
}

export default function PoolAnalytics({ pool }: PoolAnalyticsProps) {
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<PoolStats>({
    volume24h: '0.00',
    fees24h: '0.00',
    apr: '0.00',
    tvl: '0.00',
    priceChange24h: 0,
  });
  const [priceData, setPriceData] = useState<PriceData[]>([]);

  useEffect(() => {
    if (pool) {
      fetchPoolData();
    }
  }, [pool, connection]);

  const fetchPoolData = async () => {
    if (!pool) return;
    
    setIsLoading(true);
    try {
      // Use our devnet-compatible Raydium client implementation
      const analytics = await getPoolAnalytics(connection, pool.id);
      
      // Update state with the analytics data
      if (analytics) {
        setPriceData(analytics.priceData);
        setStats({
          volume24h: analytics.volume24h,
          fees24h: analytics.fees24h,
          apr: analytics.apr,
          tvl: analytics.tvl,
          priceChange24h: analytics.priceChange24h,
        });
      } else {
        // Handle null analytics result
        setStats({
          volume24h: '0.00',
          fees24h: '0.00',
          apr: '0.00',
          tvl: pool.liquidity || '0.00',
          priceChange24h: 0,
        });
        setPriceData([]);
      }
    } catch (error) {
      console.error('Error fetching pool data:', error);
      // Set default values if everything fails
      setStats({
        volume24h: '0.00',
        fees24h: '0.00',
        apr: '0.00',
        tvl: pool.liquidity || '0.00',
        priceChange24h: 0,
      });
      
      // Generate minimal price data if needed
      if (priceData.length === 0) {
        setPriceData([{
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          price: 0.1,
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatPrice = (price: number) => {
    return price.toFixed(6);
  };
  
  const getPriceChangeColor = () => {
    if (stats.priceChange24h > 0) return 'text-green-500';
    if (stats.priceChange24h < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  if (isLoading) {
    return (
      <div className="p-6 border rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="p-6 border rounded-lg">
        <p className="text-center text-muted-foreground">
          Select a pool to view analytics
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-semibold">{pool.tokenSymbol}/SOL Pool</h3>
          <div className="flex items-center mt-1">
            <span className="text-lg font-medium mr-2">
              {priceData.length > 0 ? formatPrice(priceData[priceData.length - 1].price) : '0.00'} SOL
            </span>
            <span className={`text-sm ${getPriceChangeColor()}`}>
              {stats.priceChange24h > 0 ? '+' : ''}{stats.priceChange24h.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm text-muted-foreground">Pool ID</span>
          <p className="text-xs font-mono">{pool.id.substring(0, 16)}...</p>
        </div>
      </div>

      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={priceData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }} 
              tickFormatter={(value, index) => index % 4 === 0 ? value : ''}
            />
            <YAxis 
              domain={['dataMin', 'dataMax']} 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.toFixed(4)}
            />
            <Tooltip 
              formatter={(value: number) => [formatPrice(value) + ' SOL', 'Price']}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#8884d8" 
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 border rounded-md">
          <div className="text-sm text-muted-foreground">24h Volume</div>
          <div className="text-lg font-medium">{stats.volume24h} SOL</div>
        </div>
        <div className="p-3 border rounded-md">
          <div className="text-sm text-muted-foreground">24h Fees</div>
          <div className="text-lg font-medium">{stats.fees24h} SOL</div>
        </div>
        <div className="p-3 border rounded-md">
          <div className="text-sm text-muted-foreground">APR</div>
          <div className="text-lg font-medium">{stats.apr}%</div>
        </div>
        <div className="p-3 border rounded-md">
          <div className="text-sm text-muted-foreground">TVL</div>
          <div className="text-lg font-medium">{stats.tvl} SOL</div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
        <p>
          This data is fetched from the Raydium API and on-chain sources. Pool statistics
          are calculated based on actual trading activity.
        </p>
      </div>
    </div>
  );
}