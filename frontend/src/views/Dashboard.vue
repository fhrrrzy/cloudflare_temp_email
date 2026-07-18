<template>
  <div class="dashboard-home">
    <!-- Stat Cards Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">
          <i class="pi pi-users"></i>
        </div>
        <div class="stat-details">
          <h3>Total Accounts</h3>
          <span class="value">{{ totalAccounts }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon green">
          <i class="pi pi-check-circle"></i>
        </div>
        <div class="stat-details">
          <h3>Active Accounts</h3>
          <span class="value">{{ activeAccounts }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon orange">
          <i class="pi pi-envelope"></i>
        </div>
        <div class="stat-details">
          <h3>Total Emails Received</h3>
          <span class="value">{{ totalReceivedMails }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon purple">
          <i class="pi pi-send"></i>
        </div>
        <div class="stat-details">
          <h3>Total Emails Sent</h3>
          <span class="value">{{ totalSentMails }}</span>
        </div>
      </div>
    </div>

    <!-- Quick Actions and Progress Overview -->
    <div class="dashboard-details">
      <!-- Left Panel: Recent Accounts Table -->
      <div class="card recent-accounts-card">
        <div class="card-header">
          <h2>Recently Created Accounts</h2>
          <p-button 
            label="View All" 
            icon="pi pi-arrow-right" 
            class="p-button-text p-button-sm" 
            @click="navigateToAccounts" 
          />
        </div>
        
        <data-table 
          :value="recentAccounts" 
          responsive-layout="scroll" 
          class="p-datatable-sm"
          :rows="5"
        >
          <column field="email" header="Email Address"></column>
          <column field="creationDate" header="Created On">
            <template #body="slotProps">
              {{ formatDate(slotProps.data.creationDate) }}
            </template>
          </column>
          <column field="status" header="Status">
            <template #body="slotProps">
              <badge 
                :value="slotProps.data.status" 
                :severity="slotProps.data.status === 'Active' ? 'success' : 'danger'" 
              />
            </template>
          </column>
        </data-table>
      </div>

      <!-- Right Panel: System Metrics -->
      <div class="card system-metrics-card">
        <h2>System Utilization</h2>
        <div class="metric-progress-list">
          <div class="progress-item">
            <div class="progress-info">
              <span>SMTP Server Status</span>
              <span class="pct green-text">Operational (100%)</span>
            </div>
            <progress-bar :value="100" :show-value="false" class="green-bar" />
          </div>

          <div class="progress-item">
            <div class="progress-info">
              <span>D1 Database Storage</span>
              <span class="pct">4.8 MB of 500 MB (1.2%)</span>
            </div>
            <progress-bar :value="1.2" :show-value="false" class="blue-bar" />
          </div>

          <div class="progress-item">
            <div class="progress-info">
              <span>Worker Request Limits</span>
              <span class="pct">14,242 of 100,000 (14.2%)</span>
            </div>
            <progress-bar :value="14.2" :show-value="false" class="orange-bar" />
          </div>
          
          <div class="progress-item">
            <div class="progress-info">
              <span>Attachment Buffer (S3)</span>
              <span class="pct">0.5 GB of 10 GB (5.0%)</span>
            </div>
            <progress-bar :value="5.0" :show-value="false" class="purple-bar" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { accountService } from '../services/accountService'
import { mailService } from '../services/mailService'

const router = useRouter()

const accounts = ref([])
const emails = ref([])

onMounted(() => {
  accounts.value = accountService.getAccounts()
  emails.value = mailService.getMails()
})

const totalAccounts = computed(() => accounts.value.length)
const activeAccounts = computed(() => accounts.value.filter(acc => acc.status === 'Active').length)

const recentAccounts = computed(() => {
  return [...accounts.value]
    .sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate))
    .slice(0, 5)
})

const totalReceivedMails = computed(() => emails.value.filter(m => !m.isSent).length)
const totalSentMails = computed(() => emails.value.filter(m => m.isSent).length)

const navigateToAccounts = () => {
  router.push('/dashboard/accounts')
}

const formatDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
</script>

<style scoped>
.dashboard-home {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

/* Stats Cards Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

.stat-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon i {
  font-size: 20px;
}

.stat-icon.blue { background-color: #e0f2fe; color: #0284c7; }
.stat-icon.green { background-color: #dcfce7; color: #16a34a; }
.stat-icon.orange { background-color: #ffedd5; color: #ea580c; }
.stat-icon.purple { background-color: #f3e8ff; color: #9333ea; }

.stat-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.stat-details h3 {
  margin: 0;
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-details .value {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin-top: 4px;
}

/* Dashboard Details Section */
.dashboard-details {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 30px;
}

@media (max-width: 1024px) {
  .dashboard-details {
    grid-template-columns: 1fr;
  }
}

.card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  box-sizing: border-box;
}

.card h2 {
  font-size: 18px;
  color: #0f172a;
  margin: 0 0 20px 0;
  text-align: left;
  font-weight: 600;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h2 {
  margin: 0;
}

/* System Metrics progress bars */
.metric-progress-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.pct {
  font-weight: 600;
  color: #1e293b;
}

.green-text {
  color: #16a34a;
}

/* Custom progress-bar colors */
:deep(.green-bar .p-progressbar-value) { background-color: #16a34a; }
:deep(.blue-bar .p-progressbar-value) { background-color: #0ea5e9; }
:deep(.orange-bar .p-progressbar-value) { background-color: #f97316; }
:deep(.purple-bar .p-progressbar-value) { background-color: #a855f7; }

:deep(.p-progressbar) {
  height: 8px;
  background-color: #f1f5f9;
  border-radius: 4px;
}
</style>
