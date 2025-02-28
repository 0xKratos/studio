import { Inject } from '@nestjs/common';

import { Register } from '~app-toolkit/decorators';
import { PositionFetcher } from '~position/position-fetcher.interface';
import { ContractPosition } from '~position/position.interface';
import { Network } from '~types/network.interface';

import { AAVE_V2_DEFINITION } from '../aave-v2.definition';
import { AaveV2ClaimableContractPositionHelper } from '../helpers/aave-v2.claimable.contract-position-helper';

const appId = AAVE_V2_DEFINITION.id;
const groupId = AAVE_V2_DEFINITION.groups.claimable.id;
const network = Network.AVALANCHE_MAINNET;

@Register.ContractPositionFetcher({ appId, groupId, network })
export class AvalancheAaveV2ClaimableContractPositionFetcher implements PositionFetcher<ContractPosition> {
  constructor(
    @Inject(AaveV2ClaimableContractPositionHelper)
    private readonly aaveV2ClaimableContractPositionHelper: AaveV2ClaimableContractPositionHelper,
  ) {}

  async getPositions() {
    return this.aaveV2ClaimableContractPositionHelper.getTokens({
      appId,
      groupId,
      network,
      incentivesControllerAddress: '0x01d83fe6a10d2f2b7af17034343746188272cac9',
      protocolDataProviderAddress: '0x65285e9dfab318f57051ab2b139cccf232945451',
      rewardTokenAddress: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
    });
  }
}
