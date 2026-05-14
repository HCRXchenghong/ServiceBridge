<template>
  <view class="page">
    <view class="header safe-header">
      <text class="title">数据概览</text>
    </view>
    <view class="grid">
      <view class="card">
        <text class="label">当前会话</text>
        <text class="value">{{ stats.active_conversations }}</text>
      </view>
      <view class="card">
        <text class="label">AI 接待中</text>
        <text class="value green">{{ stats.ai_serving }}</text>
      </view>
      <view class="card">
        <text class="label">当前排队</text>
        <text class="value orange">{{ stats.waiting + stats.human_requested }}</text>
      </view>
      <view class="card">
        <text class="label">人工接待</text>
        <text class="value blue">{{ stats.assigned }}</text>
      </view>
      <view class="card">
        <text class="label">评价均分</text>
        <text class="value blue">{{ averageScore }}</text>
      </view>
      <view class="card">
        <text class="label">满意率</text>
        <text class="value green">{{ satisfactionRate }}</text>
      </view>
    </view>
    <view class="status-card">
      <text class="status-title">系统状态通知</text>
      <text class="status-line">● OpenAI 接口配置已加载</text>
      <text class="status-line">● WebSocket 服务正常</text>
      <text class="status-line">● 在线客服 {{ stats.online_agents }} / {{ stats.total_agents }}</text>
    </view>
    <view class="ratings-card">
      <view class="ratings-head">
        <text class="status-title">最近服务评价</text>
        <text class="rating-count">{{ stats.rating.total }} 条</text>
      </view>
      <view v-if="!ratings.length" class="empty">暂无评价</view>
      <view v-for="item in ratings" :key="item.id" class="rating-row">
        <text class="rating-score">{{ item.score }} 分</text>
        <text class="rating-comment">{{ (item.tags || []).join('、') || item.comment || '未填写评价内容' }}</text>
      </view>
    </view>
    <admin-tab-bar active="dashboard" />
  </view>
</template>

<script>
import { fetchDashboard, fetchRatings } from '../../common/api.js'
import { connectRealtime, onRealtime } from '../../common/realtime.js'
import AdminTabBar from '../../components/AdminTabBar.vue'

export default {
  components: { AdminTabBar },
  data() {
    return {
      stats: {
        active_conversations: 0,
        ai_serving: 0,
        waiting: 0,
        human_requested: 0,
        assigned: 0,
        online_agents: 0,
        total_agents: 0,
        rating: { total: 0, average: 0, satisfaction_rate: 0 }
      },
      ratings: [],
      offRealtime: null
    }
  },
  onShow() {
    connectRealtime()
    this.load()
    if (!this.offRealtime) {
      this.offRealtime = onRealtime((payload) => {
        if (String(payload.event).indexOf('conversation.') === 0) this.load()
      })
    }
  },
  onUnload() {
    if (this.offRealtime) this.offRealtime()
  },
  computed: {
    averageScore() {
      const rating = this.stats && this.stats.rating ? this.stats.rating : {}
      const average = Number(rating.average || 0)
      return average ? average.toFixed(1) : '-'
    },
    satisfactionRate() {
      const rating = this.stats && this.stats.rating ? this.stats.rating : {}
      const rate = Number(rating.satisfaction_rate || 0)
      return rating.total ? `${Math.round(rate * 100)}%` : '-'
    }
  },
  methods: {
    async load() {
      this.stats = await fetchDashboard()
      const data = await fetchRatings(5)
      this.ratings = data.ratings || []
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #ededed;
  padding-bottom: 120rpx;
  box-sizing: border-box;
}
.header {
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #d5d5d5;
}
.title {
  font-size: 34rpx;
  font-weight: 600;
  color: #111827;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
  padding: 32rpx;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.label {
  color: #6b7280;
  font-size: 26rpx;
}
.value {
  margin-top: 12rpx;
  font-size: 48rpx;
  font-weight: 700;
  color: #111827;
}
.green { color: #07c160; }
.orange { color: #f97316; }
.blue { color: #576b95; }
.status-card {
  background: #fff;
  padding: 28rpx 32rpx;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.status-title {
  color: #6b7280;
  font-size: 26rpx;
}
.status-line {
  color: #111827;
  font-size: 28rpx;
}
.ratings-card {
  margin-top: 16rpx;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
}
.ratings-head,
.rating-row {
  display: flex;
  align-items: center;
  padding: 24rpx 32rpx;
  border-bottom: 1px solid #f3f4f6;
}
.ratings-head {
  justify-content: space-between;
}
.rating-count {
  color: #9ca3af;
  font-size: 24rpx;
}
.rating-score {
  width: 92rpx;
  color: #f59e0b;
  font-size: 28rpx;
  font-weight: 600;
}
.rating-comment {
  flex: 1;
  color: #4b5563;
  font-size: 26rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.empty {
  color: #9ca3af;
  font-size: 26rpx;
  padding: 24rpx 32rpx;
}
</style>
