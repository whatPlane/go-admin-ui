<template>
  <PageContainer>
    <ProTable :table="table" row-key="playerId">
      <template #search>
        <el-form-item :label="$t('game.player.playerId')">
          <el-input v-model="table.query.playerId" :placeholder="$t('game.player.playerIdPlaceholder')" clearable />
        </el-form-item>
        <el-form-item :label="$t('game.player.goldMin')">
          <el-input v-model="table.query.goldMin" :placeholder="$t('game.player.goldMinPlaceholder')" clearable />
        </el-form-item>
      </template>

      <el-table-column :label="$t('game.player.nickname')" prop="nickname" min-width="140" show-overflow-tooltip />
      <el-table-column :label="$t('game.player.playerId')" prop="playerId" min-width="170" show-overflow-tooltip />
      <el-table-column :label="$t('game.player.accountId')" prop="accountId" min-width="170" show-overflow-tooltip />
      <el-table-column :label="$t('game.player.gold')" prop="gold" min-width="120" align="right" />
      <el-table-column :label="$t('game.player.diamond')" prop="diamond" min-width="120" align="right" />
      <el-table-column :label="$t('game.player.createdAt')" min-width="110">
        <template #default="{ row }"><DateCell :value="row.createdAt" /></template>
      </el-table-column>
      <template #actions="{ row }">
        <el-button v-permisaction="['game:player:view']" link type="primary" @click="openDetail(row.playerId)">
          {{ $t('game.player.detail') }}
        </el-button>
      </template>
    </ProTable>

    <el-dialog v-model="detailVisible" :title="$t('game.player.detailTitle')" width="520px">
      <el-descriptions v-loading="detailLoading" :column="1" border>
        <el-descriptions-item :label="$t('game.player.playerId')">{{ detail?.playerId }}</el-descriptions-item>
        <el-descriptions-item :label="$t('game.player.accountId')">{{ detail?.accountId }}</el-descriptions-item>
        <el-descriptions-item :label="$t('game.player.nickname')">{{ detail?.nickname }}</el-descriptions-item>
        <el-descriptions-item :label="$t('game.player.gold')">{{ detail?.gold }}</el-descriptions-item>
        <el-descriptions-item :label="$t('game.player.diamond')">{{ detail?.diamond }}</el-descriptions-item>
        <el-descriptions-item :label="$t('game.player.createdAt')">
          <DateCell :value="detail?.createdAt" />
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import PageContainer from '@/components/PageContainer/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import DateCell from '@/components/DateCell/index.vue'
import { useTable } from '@/composables'
import { getPlayer, listPlayer } from '@/api/game/easy-players'
import type { PlayerInfo, PlayerQuery } from '@/api/game/easy-players'

defineOptions({ name: 'GamePlayer' })

const table = useTable<PlayerInfo, PlayerQuery>({
  api: listPlayer,
  idKey: 'playerId',
  pageSize: 10,
  defaultQuery: () => ({ playerId: undefined, goldMin: undefined })
})

const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref<PlayerInfo>()

const openDetail = async(playerId: string) => {
  detailVisible.value = true
  detailLoading.value = true
  detail.value = undefined
  try {
    const response = await getPlayer(playerId)
    detail.value = response.data
  } finally {
    detailLoading.value = false
  }
}
</script>
