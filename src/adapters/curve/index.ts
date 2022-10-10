import { Adapter, Balance, Contract } from "@lib/adapter";
import { isNotNullish } from "@lib/type";
import { getPoolsBalances, getPoolsContracts } from "./pools";
import { getGaugeBalances, getGaugesContracts } from "./gauges";
import {
  getLockedBalances,
  lockerContracts,
  getLockerContracts,
} from "./locker";

const adapter: Adapter = {
  id: "curve",
  async getContracts() {
    const pools = await getPoolsContracts();
    const gauges = await getGaugesContracts("ethereum", pools);
    const locker = getLockerContracts();

    return {
      contracts: [...pools, ...locker, ...gauges],
      revalidate: 60 * 60,
    };
  },
  async getBalances(ctx, contracts) {
    const promises: Promise<Balance[] | Balance>[] = [];
    const pools: Contract[] = [];
    const gauges: Contract[] = [];

    for (const contract of contracts) {
      if (
        contract.chain === "ethereum" &&
        contract.address === lockerContracts["ethereum"]["locker"].address
      ) {
        promises.push(getLockedBalances(ctx, "ethereum"));
      } else if (contract.type === "pool") {
        pools.push({
          ...contract,
          category: "lp",
        });
      } else if (contract.type === "gauge") {
        gauges.push(contract);
      }
    }

    promises.push(getPoolsBalances(ctx, "ethereum", pools));

    promises.push(getGaugeBalances(ctx, "ethereum", gauges));

    return {
      balances: (await Promise.all(promises)).flat().filter(isNotNullish),
    };
  },
};

export default adapter;
