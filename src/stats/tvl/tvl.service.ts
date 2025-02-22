import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Axios, { AxiosInstance } from 'axios';
import { sumBy } from 'lodash';

import { AppService } from '~app/app.service';
import { PositionFetcherRegistry } from '~position/position-fetcher.registry';
import { PositionService } from '~position/position.service';
import { Network } from '~types/network.interface';

import { TvlFetcherRegistry } from './tvl-fetcher.registry';

type AppTvl = {
  appId: string;
  appName: string;
  network: Network;
  tvl: number;
};

@Injectable()
export class TvlService {
  private readonly axios: AxiosInstance;

  constructor(
    @Inject(TvlFetcherRegistry) private readonly tvlFetcherRegistry: TvlFetcherRegistry,
    @Inject(AppService) private readonly appService: AppService,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(PositionFetcherRegistry) private readonly positionRegistry: PositionFetcherRegistry,
    @Inject(PositionService) private readonly positionService: PositionService,
  ) {
    this.axios = Axios.create({
      baseURL: this.configService.get('zapperApi.url'),
      params: { api_key: this.configService.get('zapperApi.key') },
    });
  }

  private async getTvlFromApi({ appId, network }: { appId: string; network: Network }) {
    try {
      const { data } = await this.axios.get<AppTvl>(`/v1/apps/${appId}/tvl`, {
        params: {
          network,
        },
      });
      return data;
    } catch (e) {
      return undefined;
    }
  }

  private async getGroupBasedTvl({ appId, network }: { appId: string; network: Network }) {
    const [{ groupIds: tokenGroupIds }, { groupIds: positionGroupIds }] = this.positionRegistry.getTvlEnabledGroupsIds({
      network,
      appId,
    });

    const [appTokens, positions] = await Promise.all([
      this.positionService.getAppTokenPositions<{ liquidity?: number }>({ appId, network, groupIds: tokenGroupIds }),
      this.positionService.getAppContractPositions<{ liquidity?: number }>({
        appId,
        network,
        groupIds: positionGroupIds,
      }),
    ]);

    const appTokensTvl = sumBy(appTokens, t => t.dataProps.liquidity ?? 0);
    const positionsTvl = sumBy(positions, p => p.dataProps.liquidity ?? 0);
    return appTokensTvl + positionsTvl;
  }

  async getTvl({ appId, network }: { appId: string; network: Network }): Promise<AppTvl> {
    try {
      const { name: appName } = this.appService.getApp(appId);
      const customTvlFetcher = this.tvlFetcherRegistry.get({ network, appId });

      let tvl = await customTvlFetcher?.getTvl();
      tvl ??= await this.getGroupBasedTvl({ appId, network });

      return { appId, appName, network, tvl };
    } catch (e) {
      const apiTvl = await this.getTvlFromApi({ appId, network });
      if (!apiTvl) throw new NotFoundException('No TVL registered on Studio and on Zapper API');
      return apiTvl;
    }
  }
}
