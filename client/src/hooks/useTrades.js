import { useQuery } from "@tanstack/react-query";
import { getTrades } from "../api/services";

export function useTrades(params) {
  const {
    data: tradeObjects = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["trades", params],
    queryFn: () => getTrades(params).then((r) => r.data),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const trades = tradeObjects.map((t) => t.name);

  return {
    trades,
    tradeObjects,
    isLoading,
    error,
    refetch,
  };
}

export default useTrades;
