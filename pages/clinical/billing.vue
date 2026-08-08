<template>
  <v-container fluid class="pa-0 fill-height billing-bg">
    <v-row no-gutters class="fill-height no-print">

      <!-- ── LEFT: Patient Queue ─────────────────────────────────────── -->
      <v-col cols="12" md="3" class="queue-panel b-right d-flex flex-column">
        <div class="pa-4 b-bottom bg-white">
          <div class="section-label mb-3">CASH OFFICE — QUEUE</div>
          <v-text-field
            v-model="queueSearch"
            prepend-inner-icon="mdi-magnify"
            placeholder="Search patient..."
            outlined tile dense hide-details
            class="rounded-0"
          ></v-text-field>
        </div>

        <div class="queue-list flex-grow-1 overflow-y-auto">
          <div
            v-for="stmt in filteredQueue"
            :key="stmt.patientId"
            :class="['queue-item pa-4 b-bottom', selectedPatientId === stmt.patientId ? 'queue-item--active' : '']"
            @click="selectPatient(stmt.patientId)"
          >
            <div class="d-flex align-center justify-space-between mb-1">
              <span class="text-caption font-weight-black gov-text-primary uppercase">{{ stmt.patientName }}</span>
              <v-chip x-small dark label :color="statusColor(stmt.status)" class="font-weight-black">{{ stmt.status }}</v-chip>
            </div>
            <div class="d-flex align-center justify-space-between">
              <span class="text-caption grey--text">{{ stmt.patientId }}</span>
              <span class="text-caption font-weight-black" :class="stmt.balance > 0 ? 'error--text' : 'success--text'">
                {{ stmt.balance > 0 ? 'DUE: ' + fmt(stmt.balance) : 'CLEARED' }}
              </span>
            </div>
            <div v-if="hasClearance(stmt.patientId)" class="mt-1">
              <v-chip x-small label color="#00A99D" dark class="font-weight-black">CONSULTATION CLEARED</v-chip>
            </div>
          </div>
          <div v-if="filteredQueue.length === 0" class="pa-8 text-center grey--text text-caption">
            No patients in queue
          </div>
        </div>
      </v-col>

      <!-- ── CENTER: Invoice Detail ──────────────────────────────────── -->
      <v-col cols="12" md="6" class="invoice-panel d-flex flex-column">
        <div v-if="!selectedPatientId" class="fill-height d-flex align-center justify-center">
          <div class="text-center grey--text">
            <v-icon size="64" color="#E2E8F0">mdi-cash-register</v-icon>
            <div class="text-caption font-weight-black mt-4 uppercase ls-1">Select a patient from the queue</div>
          </div>
        </div>

        <template v-else>
          <!-- Invoice Header -->
          <div class="pa-6 bg-white b-bottom">
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="section-label mb-1">ACCOUNT — {{ statement.patientId }}</div>
                <div class="text-h6 font-weight-black gov-text-primary uppercase">{{ statement.patientName }}</div>
              </div>
              <div class="text-right">
                <v-chip label :color="statusColor(statement.status)" dark class="font-weight-black mb-1">{{ statement.status }}</v-chip>
                <div class="text-caption grey--text">Updated: {{ fmtDate(statement.updatedAt) }}</div>
              </div>
            </div>
          </div>

          <!-- Charge Lines -->
          <div class="flex-grow-1 overflow-y-auto pa-6">
            <div v-for="group in chargeGroups" :key="group.key" class="mb-6">
              <div class="d-flex align-center mb-3">
                <v-icon small :color="group.color" class="mr-2">{{ group.icon }}</v-icon>
                <span class="text-caption font-weight-black uppercase ls-1" :style="`color:${group.color}`">{{ group.label }}</span>
                <v-divider class="ml-3"></v-divider>
              </div>

              <!-- ── SPECIAL: Medication / Drug charges — per-item selector ── -->
              <template v-if="group.key === 'drug'">
                <v-card flat tile class="b-1 overflow-hidden">
                  <div class="pa-3 bg-grey lighten-4 border-bottom d-flex align-center justify-space-between">
                    <span class="text-caption font-weight-black grey--text uppercase">
                      Patient may choose which medications to pay for. Out-of-stock items cannot be collected here.
                    </span>
                  </div>
                  <div v-for="charge in group.charges" :key="charge.id"
                    :class="['medication-row pa-4 b-bottom', charge.status === 'Cancelled' || charge.status === 'Waived' ? 'charge-row--muted' : '']">
                    <div class="d-flex align-center justify-space-between">
                      <!-- Checkbox for selection -->
                      <div class="d-flex align-center" style="min-width:0; flex:1">
                        <v-checkbox
                          v-model="selectedMedCharges"
                          :value="charge.id"
                          :disabled="charge.status === 'Cancelled' || charge.status === 'Waived' || isMedOutOfStock(charge)"
                          hide-details dense class="mt-0 pt-0 mr-2" style="flex-shrink:0"
                        ></v-checkbox>
                        <div style="min-width:0">
                          <div class="text-caption font-weight-black">{{ charge.description }}</div>
                          <div class="text-caption grey--text" style="font-size:10px">
                            Pharmacy · {{ fmtDate(charge.createdAt) }} · Qty: {{ charge.quantity }}
                          </div>
                          <!-- Stock badge -->
                          <div class="mt-1">
                            <v-chip x-small :color="getMedStockColor(charge).bg" class="font-weight-black" style="font-size:9px">
                              <v-icon x-small :color="getMedStockColor(charge).icon" left>{{ getMedStockColor(charge).mdi }}</v-icon>
                              {{ getMedStockColor(charge).label }}
                            </v-chip>
                          </div>
                        </div>
                      </div>
                      <!-- Pricing -->
                      <div class="text-right ml-4" style="flex-shrink:0">
                        <div class="text-caption grey--text">{{ fmt(charge.unitPrice) }} × {{ charge.quantity }}</div>
                        <div class="text-caption font-weight-black" :class="charge.status === 'Waived' || charge.status === 'Cancelled' ? 'grey--text text-decoration-line-through' : 'gov-text-primary'">
                          {{ fmt(charge.total) }}
                        </div>
                        <v-chip x-small label :color="chargeStatusColor(charge.status)" dark class="font-weight-black mt-1">{{ charge.status }}</v-chip>
                      </div>
                      <div v-if="isAdmin" class="ml-2" style="flex-shrink:0">
                        <v-btn v-if="charge.status === 'Open'" icon x-small @click="waive(charge.id)" title="Waive">
                          <v-icon x-small color="orange">mdi-hand-wave</v-icon>
                        </v-btn>
                        <v-btn v-if="charge.status === 'Waived'" icon x-small @click="reopen(charge.id)" title="Reopen">
                          <v-icon x-small color="grey">mdi-refresh</v-icon>
                        </v-btn>
                      </div>
                    </div>
                  </div>
                  <!-- Medication payment subtotal -->
                  <div class="pa-4 bg-grey lighten-4 d-flex align-center justify-space-between">
                    <div class="text-caption grey--text">
                      {{ selectedMedCharges.length }} medication(s) selected for payment
                    </div>
                    <div class="text-caption font-weight-black">
                      Subtotal: <span class="gov-text-primary">{{ fmt(selectedMedSubtotal) }}</span>
                    </div>
                  </div>
                </v-card>
                <v-alert v-if="hasOutOfStockMeds" dense text type="warning" class="mt-2 rounded-0 text-caption" color="orange">
                  <v-icon left small color="orange">mdi-package-variant-remove</v-icon>
                  Some medications are marked <strong>OUT OF STOCK</strong> at the hospital pharmacy. The patient will need to procure those externally and payment will not be collected for them.
                </v-alert>
              </template>

              <!-- Other charge groups (non-medication) — original table -->
              <v-card v-else flat tile class="b-1 overflow-hidden">
                <table class="charge-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th class="text-right">Qty</th>
                      <th class="text-right">Unit Price</th>
                      <th class="text-right">Total</th>
                      <th class="text-center">Status</th>
                      <th v-if="isAdmin"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="charge in group.charges" :key="charge.id" :class="charge.status === 'Cancelled' || charge.status === 'Waived' ? 'charge-row--muted' : ''">
                      <td>
                        <div class="text-caption font-weight-medium">{{ charge.description }}</div>
                        <div class="text-caption grey--text" style="font-size:10px">{{ charge.departmentSource }} · {{ fmtDate(charge.createdAt) }}</div>
                      </td>
                      <td class="text-right text-caption">{{ charge.quantity }}</td>
                      <td class="text-right text-caption">{{ fmt(charge.unitPrice) }}</td>
                      <td class="text-right text-caption font-weight-black">{{ fmt(charge.total) }}</td>
                      <td class="text-center">
                        <v-chip x-small label :color="chargeStatusColor(charge.status)" dark class="font-weight-black">{{ charge.status }}</v-chip>
                      </td>
                      <td v-if="isAdmin" class="text-right">
                        <v-btn v-if="charge.status === 'Open'" icon x-small @click="waive(charge.id)" title="Waive">
                          <v-icon x-small color="orange">mdi-hand-wave</v-icon>
                        </v-btn>
                        <v-btn v-if="charge.status === 'Waived'" icon x-small @click="reopen(charge.id)" title="Reopen">
                          <v-icon x-small color="grey">mdi-refresh</v-icon>
                        </v-btn>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </v-card>
            </div>


            <!-- Manual charge (Admin/Cash Office only) -->
            <v-card v-if="isAdmin || isBilling" flat tile class="b-1 pa-4 mb-6">
              <div class="section-label mb-3">ADD MANUAL CHARGE</div>
              <v-row dense>
                <v-col cols="12" sm="5">
                  <v-text-field v-model="manualCharge.description" label="Description" outlined tile dense hide-details class="rounded-0"></v-text-field>
                </v-col>
                <v-col cols="6" sm="3">
                  <v-text-field v-model.number="manualCharge.unitPrice" label="Amount (XAF)" type="number" outlined tile dense hide-details class="rounded-0"></v-text-field>
                </v-col>
                <v-col cols="6" sm="2">
                  <v-text-field v-model.number="manualCharge.quantity" label="Qty" type="number" outlined tile dense hide-details class="rounded-0"></v-text-field>
                </v-col>
                <v-col cols="12" sm="2">
                  <v-btn color="#003366" dark block tile depressed height="40" @click="addManualCharge" class="font-weight-black text-caption">ADD</v-btn>
                </v-col>
              </v-row>
            </v-card>

            <!-- Payment History -->
            <div v-if="statement.payments.length > 0" class="mb-6">
              <div class="d-flex align-center mb-3">
                <v-icon small color="#00A99D" class="mr-2">mdi-cash-check</v-icon>
                <span class="text-caption font-weight-black uppercase ls-1" style="color:#00A99D">PAYMENTS RECEIVED</span>
                <v-divider class="ml-3"></v-divider>
              </div>
              <v-card flat tile class="b-1 overflow-hidden">
                <table class="charge-table">
                  <thead>
                    <tr>
                      <th>Receipt #</th>
                      <th>Date</th>
                      <th>Method</th>
                      <th>Cashier</th>
                      <th class="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="pay in statement.payments" :key="pay.id">
                      <td class="text-caption font-weight-black">
                        <v-btn x-small icon color="#003366" @click="printReceipt(pay)" title="Print Receipt" class="mr-1">
                          <v-icon x-small>mdi-printer</v-icon>
                        </v-btn>
                        {{ pay.receiptNumber }}
                      </td>
                      <td class="text-caption">{{ fmtDate(pay.paidAt) }}</td>
                      <td class="text-caption">{{ pay.method }}</td>
                      <td class="text-caption">{{ pay.cashier }}</td>
                      <td class="text-right text-caption font-weight-black success--text">{{ fmt(pay.amount) }}</td>
                    </tr>
                  </tbody>
                </table>
              </v-card>
            </div>
          </div>

          <!-- Invoice Footer Totals -->
          <div class="pa-6 bg-white b-top">
            <v-row no-gutters>
              <v-col cols="6">
                <div class="text-caption grey--text">Total Charges</div>
                <div class="text-h6 font-weight-black gov-text-primary">{{ fmt(statement.totalCharges) }}</div>
              </v-col>
              <v-col cols="3" class="text-center">
                <div class="text-caption grey--text">Paid</div>
                <div class="text-subtitle-1 font-weight-black success--text">{{ fmt(statement.amountPaid) }}</div>
              </v-col>
              <v-col cols="3" class="text-right">
                <div class="text-caption grey--text">Balance Due</div>
                <div class="text-h6 font-weight-black" :class="statement.balance > 0 ? 'error--text' : 'success--text'">{{ fmt(statement.balance) }}</div>
              </v-col>
            </v-row>
          </div>
        </template>
      </v-col>

      <!-- ── RIGHT: Payment / Clearance Panel ────────────────────────── -->
      <v-col cols="12" md="3" class="payment-panel b-left d-flex flex-column">
        <!-- Tab: Collect Payment / Issue Clearance -->
        <div class="pa-4 b-bottom bg-white">
          <v-tabs v-model="rightTab" background-color="transparent" color="#003366" hide-slider height="36">
            <v-tab v-for="(tab, i) in rightTabs" :key="i" class="text-caption font-weight-black ls-1" :class="rightTab === i ? 'cash-tab--active' : ''">
              <v-icon left x-small>{{ tab.icon }}</v-icon>{{ tab.label }}
            </v-tab>
          </v-tabs>
        </div>

        <!-- Tab 0: Collect Payment -->
        <div v-show="rightTab === 0" class="pa-6 flex-grow-1 overflow-y-auto">
          <template v-if="selectedPatientId && statement.balance > 0">
            <v-card flat tile class="b-1 pa-4 mb-4 bg-light">
              <div class="text-caption grey--text mb-1">Outstanding Balance</div>
              <div class="text-h5 font-weight-black error--text">{{ fmt(statement.balance) }}</div>
            </v-card>

            <v-form ref="payForm" v-model="payValid">
              <div class="text-caption font-weight-black grey--text uppercase ls-1 mb-2">Payment Method</div>
              <v-row dense class="mb-4">
                <v-col v-for="m in paymentMethods" :key="m.value" cols="6">
                  <v-card
                    flat tile
                    :class="['method-chip pa-3 text-center b-1', payForm.method === m.value ? 'method-chip--active' : '']"
                    @click="payForm.method = m.value"
                    style="cursor:pointer"
                  >
                    <v-icon :color="payForm.method === m.value ? 'white' : '#003366'" small>{{ m.icon }}</v-icon>
                    <div class="text-caption font-weight-black mt-1 uppercase" style="font-size:9px">{{ m.label }}</div>
                  </v-card>
                </v-col>
              </v-row>

              <v-text-field
                v-model.number="payForm.amount"
                label="Amount to Collect (XAF)"
                type="number"
                outlined tile dense
                :rules="[v => !!v && v > 0 || 'Enter amount', v => v <= statement.balance || 'Exceeds balance']"
                :hint="'Max: ' + fmt(statement.balance)"
                persistent-hint
                class="rounded-0 mb-2"
                prefix="XAF"
              ></v-text-field>

              <div v-if="selectedMedSubtotal > 0 && selectedMedSubtotal !== payForm.amount" class="text-right mb-2">
                <a href="javascript:;" class="text-caption font-weight-black success--text text-decoration-none" @click="payForm.amount = selectedMedSubtotal">
                  👉 Autofill selected meds total: {{ fmt(selectedMedSubtotal) }}
                </a>
              </div>

              <v-text-field
                v-model="payForm.reference"
                label="Reference / Transaction # (optional)"
                outlined tile dense hide-details
                class="rounded-0 mb-6"
              ></v-text-field>

              <v-btn
                color="#00A99D" dark block height="48" tile depressed
                :disabled="!payValid || !payForm.method"
                :loading="payLoading"
                @click="recordPayment"
                class="font-weight-black text-caption ls-1 mb-3"
              >
                RECORD PAYMENT
                <v-icon right small>mdi-cash-check</v-icon>
              </v-btn>

              <v-btn
                v-if="isAdmin && statement.balance > 0"
                outlined block tile height="40"
                color="orange"
                @click="waiverDialog = true"
                class="font-weight-black text-caption"
              >
                GRANT FULL WAIVER
                <v-icon right small>mdi-hand-wave</v-icon>
              </v-btn>
            </v-form>
          </template>

          <template v-else-if="selectedPatientId && statement.balance === 0 && statement.totalCharges > 0">
            <v-card flat tile class="b-1 pa-6 text-center">
              <v-icon size="48" color="#00A99D">mdi-check-circle</v-icon>
              <div class="text-caption font-weight-black mt-3 uppercase success--text">Account Cleared</div>
              <div class="text-caption grey--text mt-1">All charges have been settled</div>
              <v-btn outlined tile block color="#003366" class="mt-4 font-weight-black text-caption" @click="printReceipt">
                <v-icon left small>mdi-printer</v-icon> PRINT RECEIPT
              </v-btn>
            </v-card>
          </template>

          <template v-else>
            <div class="text-center grey--text mt-10">
              <v-icon size="40" color="#E2E8F0">mdi-cash-register</v-icon>
              <div class="text-caption mt-3">Select a patient to collect payment</div>
            </div>
          </template>
        </div>

        <!-- Tab 1: Issue Clearance -->
        <div v-show="rightTab === 1" class="pa-6 flex-grow-1 overflow-y-auto">
          <template v-if="selectedPatientId">
            <v-card flat tile class="b-1 pa-4 mb-4 bg-light">
              <div class="text-caption grey--text mb-1">Patient</div>
              <div class="text-subtitle-1 font-weight-black gov-text-primary">{{ statement.patientName }}</div>
              <div class="text-caption grey--text">{{ statement.patientId }}</div>
            </v-card>

            <div class="text-caption font-weight-black grey--text uppercase ls-1 mb-2">Clearance for Consultation</div>
            <v-card flat tile class="b-1 pa-4 mb-4">
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="text-caption">Consultation fee</span>
                <span class="text-caption font-weight-black">{{ fmt(consultationFee) }}</span>
              </div>
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="text-caption">Status</span>
                <v-chip v-if="activeClearance" x-small color="#00A99D" dark class="font-weight-black">CLEARED</v-chip>
                <v-chip v-else x-small color="orange" dark class="font-weight-black">NOT YET CLEARED</v-chip>
              </div>
              <div v-if="activeClearance" class="text-caption grey--text mt-2">
                Clearance code: {{ activeClearance.clearanceCode }}<br>
                Issued: {{ fmtDate(activeClearance.issuedAt) }} by {{ activeClearance.issuedBy }}
              </div>
            </v-card>

            <v-btn
              v-if="!activeClearance"
              color="#003366" dark block height="48" tile depressed
              @click="openClearanceDialog"
              class="font-weight-black text-caption ls-1 mb-3"
            >
              ISSUE CONSULTATION CLEARANCE
              <v-icon right small>mdi-check-decagram</v-icon>
            </v-btn>

            <v-btn
              v-if="activeClearance"
              color="#00A99D" dark block height="40" tile depressed
              @click="printClearanceTicket"
              class="font-weight-black text-caption ls-1 mb-3"
            >
              PRINT CLEARANCE TICKET
              <v-icon right small>mdi-printer</v-icon>
            </v-btn>

            <v-btn
              v-if="activeClearance && (isAdmin || isBilling)"
              outlined block tile height="40"
              color="error"
              @click="revokeClearance"
              class="font-weight-black text-caption"
            >
              REVOKE CLEARANCE
              <v-icon right small>mdi-close-octagon</v-icon>
            </v-btn>

            <div class="mt-4 text-caption grey--text font-italic">
              Clearances expire after 24 hours. Patient must present clearance code at the consultation desk.
            </div>
          </template>

          <template v-else>
            <div class="text-center grey--text mt-10">
              <v-icon size="40" color="#E2E8F0">mdi-check-decagram</v-icon>
              <div class="text-caption mt-3">Select a patient to issue clearance</div>
            </div>
          </template>
        </div>

        <!-- Last Receipt Preview -->
        <div v-if="lastReceipt" class="pa-4 b-top bg-white">
          <div class="d-flex justify-space-between align-center mb-2">
            <div class="section-label">LAST RECEIPT</div>
            <v-btn x-small tile outlined color="#003366" class="font-weight-black text-caption" @click="printReceipt(lastReceipt)">
              <v-icon left x-small>mdi-printer</v-icon> PRINT
            </v-btn>
          </div>
          <div class="receipt-preview pa-3 b-1">
            <div class="d-flex justify-space-between text-caption mb-1">
              <span class="font-weight-black">{{ lastReceipt.receiptNumber }}</span>
              <span class="success--text font-weight-black">{{ fmt(lastReceipt.amount) }}</span>
            </div>
            <div class="text-caption grey--text">{{ lastReceipt.method }} · {{ fmtDate(lastReceipt.paidAt) }}</div>
            <div class="text-caption grey--text">Cashier: {{ lastReceipt.cashier }}</div>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Waiver Dialog -->
    <v-dialog v-model="waiverDialog" max-width="420" persistent>
      <v-card flat tile>
        <div class="pa-4 bg-orange white--text font-weight-black text-caption uppercase">GRANT FULL WAIVER</div>
        <div class="pa-6">
          <v-alert dense text type="warning" class="mb-4 text-caption rounded-0">
            This will waive all remaining charges ({{ fmt(statement ? statement.balance : 0) }}) for this patient. This action is audited.
          </v-alert>
          <v-textarea v-model="waiverReason" label="Reason for waiver (required)" outlined tile dense rows="3" class="rounded-0"></v-textarea>
        </div>
        <div class="pa-4 d-flex justify-end b-top">
          <v-btn text tile class="mr-2 font-weight-black text-caption" @click="waiverDialog = false">CANCEL</v-btn>
          <v-btn color="orange" dark tile depressed :disabled="!waiverReason" @click="grantWaiver" class="font-weight-black text-caption">CONFIRM WAIVER</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Clearance Issue Dialog -->
    <v-dialog v-model="clearanceDialog" max-width="420" persistent>
      <v-card flat tile>
        <div class="pa-4 bg-navy white--text font-weight-black text-caption uppercase">ISSUE CONSULTATION CLEARANCE</div>
        <div class="pa-6">
          <v-alert dense text type="info" class="mb-4 text-caption rounded-0">
            Patient will pay the consultation fee upfront at the cash office to receive clearance for the doctor's consultation.
          </v-alert>
          <v-card flat tile class="b-1 pa-4 mb-4 bg-light">
            <div class="d-flex justify-space-between mb-2">
              <span class="text-caption">Consultation fee</span>
              <span class="text-caption font-weight-black">{{ fmt(consultationFee) }}</span>
            </div>
          </v-card>
          <v-select
            v-model="clearanceDepartment"
            :items="consultationDepartments"
            label="Department / Specialty"
            outlined tile dense
            prepend-inner-icon="mdi-doctor"
            class="rounded-0 mb-3"
          ></v-select>
          <v-text-field
            v-model.number="clearanceAmount"
            type="number"
            label="Amount Paid (XAF)"
            outlined tile dense
            :rules="[v => !!v && v > 0 || 'Enter amount']"
            class="rounded-0 mb-4"
            prefix="XAF"
          ></v-text-field>
          <v-select
            v-model="clearanceMethod"
            :items="['Cash', 'MTN MoMo', 'Orange Money', 'Cheque']"
            label="Payment method"
            outlined tile dense
            class="rounded-0 mb-2"
          ></v-select>
        </div>
        <div class="pa-4 d-flex justify-end b-top">
          <v-btn text tile class="mr-2 font-weight-black text-caption" @click="clearanceDialog = false">CANCEL</v-btn>
          <v-btn color="#003366" dark tile depressed :disabled="!clearanceAmount || clearanceAmount <= 0" @click="issueClearance" class="font-weight-black text-caption">CONFIRM</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- HIDDEN RECEIPT PRINT TEMPLATE -->
    <div v-if="printReceiptData" class="printable-receipt-only">
       <div class="receipt-header text-center pb-2 mb-4">
          <div class="text-subtitle-2 font-weight-black uppercase">CAMERO HEALTH SYSTEM</div>
          <div class="text-caption font-weight-bold uppercase">REPUBLIC OF CAMEROON</div>
          <div class="text-caption font-weight-bold uppercase">{{ institution }}</div>
          <div class="text-caption mt-1 font-italic" style="font-size: 10px;">Peace - Work - Fatherland / Paix - Travail - Patrie</div>
          <div style="border-top: 2px dashed #1B1F23; margin-top: 10px;"></div>
          <div class="text-subtitle-2 font-weight-black mt-2 uppercase text-center" style="letter-spacing: 1px;">
             OFFICIAL RECEIPT / REÇU OFFICIEL
          </div>
       </div>

       <div class="receipt-body">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; line-height: 2.0; color: black;">
             <tbody>
                <tr>
                   <td style="font-weight: bold; width: 45%;">Receipt Number:</td>
                   <td class="font-weight-black">{{ printReceiptData.receiptNumber }}</td>
                </tr>
                <tr>
                   <td style="font-weight: bold;">Date & Time:</td>
                   <td>{{ fmtDate(printReceiptData.paidAt) }} {{ formatTime(printReceiptData.paidAt) }}</td>
                </tr>
                <tr>
                   <td style="font-weight: bold;">Patient Name:</td>
                   <td class="uppercase font-weight-black">{{ printReceiptData.patientName }}</td>
                </tr>
                <tr>
                   <td style="font-weight: bold;">Patient ID (MRN):</td>
                   <td>{{ printReceiptData.patientId }}</td>
                </tr>
                <tr>
                   <td style="font-weight: bold;">Payment Method:</td>
                   <td>{{ printReceiptData.method }}</td>
                </tr>
                <tr v-if="printReceiptData.reference">
                   <td style="font-weight: bold;">Reference / Code:</td>
                   <td><strong style="text-decoration: underline;">{{ printReceiptData.reference }}</strong></td>
                </tr>
                <tr>
                   <td style="font-weight: bold;">Details:</td>
                   <td>{{ printReceiptData.note || 'Payment of charges' }}</td>
                </tr>
                <tr style="border-top: 1px dashed #1B1F23; border-bottom: 1px dashed #1B1F23;">
                   <td style="font-weight: bold; font-size: 13px; padding: 4px 0;">TOTAL PAID:</td>
                   <td style="font-weight: 900; font-size: 14px; padding: 4px 0;">{{ fmt(printReceiptData.amount) }}</td>
                </tr>
             </tbody>
          </table>
       </div>

       <div class="receipt-footer mt-4 text-center" style="font-size: 10px; color: black;">
          <div class="mb-2">Issued by: {{ printReceiptData.cashier }}</div>
          <div style="border-top: 1px dashed #1B1F23; padding-top: 4px;">
             Thank you for your payment / Merci pour votre confiance.<br>
             Keep this receipt as proof of payment.
          </div>
       </div>
    </div>

  </v-container>
</template>

<script>
const CATEGORY_GROUPS = [
  { key: 'consultation', label: 'Consultations', icon: 'mdi-doctor', color: '#003366' },
  { key: 'laboratory',   label: 'Laboratory',    icon: 'mdi-flask',  color: '#D97706' },
  { key: 'imaging',      label: 'Imaging',       icon: 'mdi-radiology-box', color: '#7C3AED' },
  { key: 'drug',         label: 'Medications',   icon: 'mdi-pill',   color: '#0B3D2E' },
  { key: 'hospitalization', label: 'Hospitalisation', icon: 'mdi-bed', color: '#0F766E' },
  { key: 'nursing_act',  label: 'Nursing Acts',  icon: 'mdi-medical-bag', color: '#00A99D' },
  { key: 'procedure',    label: 'Procedures',    icon: 'mdi-scalpel', color: '#C0392B' },
  { key: 'supply',       label: 'Consumables',   icon: 'mdi-syringe', color: '#6B7280' },
  { key: 'manual',       label: 'Manual Charges', icon: 'mdi-pencil', color: '#6B7280' },
  { key: 'legacy',       label: 'Previous Invoices', icon: 'mdi-history', color: '#9CA3AF' }
]

export default {
  head: { title: 'Cash Office & Facturation' },
  data() {
    return {
      printReceiptData: null,
      leftTab: 0,
      rightTab: 0,
      queueSearch: '',
      selectedPatientId: null,
      payValid: false,
      payLoading: false,
      payForm: { amount: null, method: 'Cash', reference: '' },
      selectedMedCharges: [],
      priceSearch: '',
      priceSectionTab: 0,
      manualCharge: { description: '', unitPrice: null, quantity: 1 },
      waiverDialog: false,
      waiverReason: '',
      lastReceipt: null,
      clearanceDialog: false,
      clearanceAmount: null,
      clearanceMethod: 'Cash',
      clearanceDepartment: 'General Medicine',
      consultationDepartments: [
        'General Medicine',
        'Emergency',
        'Maternity',
        'Paediatrics',
        'Surgery',
        'Specialist clinic',
        'Internal Medicine',
        'Cardiology',
        'Dermatology',
        'Ophthalmology',
        'ENT',
        'Orthopaedics',
        'Gynaecology',
        'Urology',
        'Neurology',
        'Psychiatry'
      ],
      paymentMethods: [
        { value: 'Cash',         label: 'Cash',         icon: 'mdi-cash' },
        { value: 'MTN MoMo',     label: 'MTN MoMo',     icon: 'mdi-cellphone' },
        { value: 'Orange Money', label: 'Orange Money', icon: 'mdi-cellphone-wireless' },
        { value: 'Cheque',       label: 'Cheque',       icon: 'mdi-checkbook' }
      ]
    }
  },
  computed: {
    isAdmin()      { return this.$store.state.auth.role === 'ADMIN' },
    isBilling()    { return this.$store.state.auth.role === 'BILLING' },
    institution()  { return this.$store.state.auth.institution || 'MINSANTE Hospital' },
    allPatients() { return this.$store.getters['clinical/getPatients'] || [] },
    allMedications() { return this.$store.getters['clinical/getMedications'] || [] },
    fullQueue() {
      return this.allPatients.map(p => this.$store.getters['billing/statementForPatient'](p.id))
    },
    filteredQueue() {
      const q = this.queueSearch.toLowerCase()
      if (!q) return this.fullQueue
      return this.fullQueue.filter(s => s.patientName.toLowerCase().includes(q) || s.patientId.toLowerCase().includes(q))
    },
    // Per-medication selection: subtotal of currently checked items
    selectedMedSubtotal() {
      if (!this.statement) return 0
      return this.statement.charges
        .filter(c => c.category === 'drug' && this.selectedMedCharges.includes(c.id))
        .reduce((sum, c) => sum + c.total, 0)
    },
    // Are any of this patient's drug charges out of stock?
    hasOutOfStockMeds() {
      if (!this.selectedPatientId) return false
      const meds = this.allMedications.filter(m => m.patientId === this.selectedPatientId)
      return meds.some(m => m.inStock === false)
    },
    statement() {
      if (!this.selectedPatientId) return null
      return this.$store.getters['billing/statementForPatient'](this.selectedPatientId)
    },
    chargeGroups() {
      if (!this.statement) return []
      return CATEGORY_GROUPS
        .map(g => ({ ...g, charges: this.statement.charges.filter(c => c.category === g.key) }))
        .filter(g => g.charges.length > 0)
    },
    consultationFee() {
      const catalog = this.$store.getters['billing/catalog']
      if (!catalog || !catalog.consultations || !catalog.consultations.length) return 2500
      return catalog.consultations[0].unitPrice || 2500
    },
    rightTabs() {
      return [
        { label: 'COLLECT', icon: 'mdi-cash' },
        { label: 'CLEARANCE', icon: 'mdi-check-decagram' }
      ]
    },
    activeClearance() {
      if (!this.selectedPatientId) return null
      return this.$store.getters['billing/getPaymentClearance'](this.selectedPatientId, 'consultation')
    },
    catalogSections() {
      return this.$store.getters['billing/catalog'] || {}
    },
    catalogTabs() {
      const labels = {
        consultations: 'Consultations',
        labTests: 'Lab Tests',
        imaging: 'Imaging',
        drugs: 'Drugs',
        hospitalization: 'Hospitalisation',
        nursingActs: 'Nursing Acts',
        supplies: 'Supplies',
        procedures: 'Procedures'
      }
      return Object.keys(this.catalogSections).map(key => ({
        key,
        label: labels[key] || key,
        items: this.catalogSections[key] || []
      }))
    }
  },
  mounted() {
    this.$store.commit('clinical/LOAD_FROM_STORAGE')
    this.$store.commit('facility/RELOAD_FROM_STORAGE')
    this.$store.dispatch('billing/loadFromStorage')
  },
  methods: {
    selectPatient(patientId) {
      this.selectedPatientId = patientId
      this.payForm = { amount: null, method: 'Cash', reference: '' }
      // Reset medication selections & pre-select all in-stock, paid-eligible ones
      this.selectedMedCharges = []
      this.$nextTick(() => {
        const drugCharges = (this.statement?.charges || []).filter(c => c.category === 'drug' && c.status === 'Open' && !this.isMedOutOfStock(c))
        this.selectedMedCharges = drugCharges.map(c => c.id)
      })
    },
    // Look up the corresponding lab medication record for a billing charge
    getMedOrderForCharge(charge) {
      return this.allMedications.find(m =>
        m.patientId === this.selectedPatientId &&
        (m.medication || '').toLowerCase().includes((charge.description || '').toLowerCase().split(' ')[0])
      ) || null
    },
    isMedOutOfStock(charge) {
      const med = this.getMedOrderForCharge(charge)
      return med ? med.inStock === false : false
    },
    getMedStockColor(charge) {
      const med = this.getMedOrderForCharge(charge)
      if (!med || med.inStock === null || med.inStock === undefined) {
        return { bg: '#F3F4F6', icon: '#9CA3AF', mdi: 'mdi-help-circle-outline', label: 'Stock Unknown' }
      }
      if (med.inStock === true) {
        return { bg: '#E8F5E9', icon: '#00A99D', mdi: 'mdi-check-circle', label: 'In Stock' }
      }
      return { bg: '#FEF2F2', icon: '#C0392B', mdi: 'mdi-close-circle', label: 'Out of Stock' }
    },
    hasClearance(patientId) {
      return !!this.$store.getters['billing/getPaymentClearance'](patientId, 'consultation')
    },
    async recordPayment() {
      if (!this.$refs.payForm.validate() || !this.payForm.method) return
      this.payLoading = true
      const payment = await this.$store.dispatch('billing/recordPayment', {
        patientId: this.selectedPatientId,
        amount: this.payForm.amount,
        method: this.payForm.method,
        reference: this.payForm.reference,
        paidChargeIds: this.selectedMedCharges
      })
      this.lastReceipt = payment
      this.payForm = { amount: null, method: 'Cash', reference: '' }
      this.payLoading = false
      this.$toast.success('Payment of ' + this.fmt(payment.amount) + ' recorded — ' + payment.receiptNumber)
    },
    addManualCharge() {
      if (!this.manualCharge.description || !this.manualCharge.unitPrice) return
      this.$store.dispatch('billing/createManualCharge', {
        patientId: this.selectedPatientId,
        description: this.manualCharge.description,
        unitPrice: this.manualCharge.unitPrice,
        quantity: this.manualCharge.quantity || 1,
        category: 'manual'
      })
      this.manualCharge = { description: '', unitPrice: null, quantity: 1 }
      this.$toast.success('Manual charge added.')
    },
    waive(chargeId)  { this.$store.dispatch('billing/waiveCharge', chargeId) },
    reopen(chargeId) { this.$store.dispatch('billing/reopenCharge', chargeId) },
    grantWaiver() {
      if (!this.waiverReason) return
      const charges = this.statement.charges.filter(c => c.status === 'Open')
      charges.forEach(c => this.$store.dispatch('billing/waiveCharge', c.id))
      this.waiverDialog = false
      this.waiverReason = ''
      this.$toast.success('Full waiver granted.')
    },
    openClearanceDialog() {
      this.clearanceAmount = this.consultationFee
      this.clearanceDialog = true
    },
    async issueClearance() {
      if (!this.clearanceAmount || this.clearanceAmount <= 0) return
      const result = await this.$store.dispatch('billing/issueClearance', {
        patientId: this.selectedPatientId,
        serviceType: 'consultation',
        department: this.clearanceDepartment,
        amount: this.clearanceAmount,
        method: this.clearanceMethod
      })
      if (result) {
        this.lastReceipt = result.payment
        this.clearanceDialog = false
        this.clearanceAmount = null
        this.clearanceDepartment = 'General Medicine'
        this.rightTab = 0
        this.$toast.success('Clearance issued — ' + result.clearance.clearanceCode)
      }
    },
    async revokeClearance() {
      if (!this.activeClearance) return
      await this.$store.dispatch('billing/revokeClearance', this.activeClearance.id)
      this.$toast.warning('Clearance revoked')
    },
    filteredCatalogItems(items) {
      if (!this.priceSearch) return items
      const q = this.priceSearch.toLowerCase()
      return items.filter(item => item.name.toLowerCase().includes(q) || (item.aliases && item.aliases.some(a => a.toLowerCase().includes(q))))
    },
    async printReceipt(payment) {
      let targetPayment = (payment && payment.receiptNumber) ? payment : null
      if (!targetPayment) {
        targetPayment = this.lastReceipt
      }
      if (!targetPayment && this.statement && this.statement.payments && this.statement.payments.length) {
        targetPayment = [...this.statement.payments].sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt))[0]
      }
      if (!targetPayment && this.selectedPatientId) {
        targetPayment = {
          receiptNumber: 'RCT-PREVIEW',
          paidAt: new Date().toISOString(),
          patientId: this.selectedPatientId,
          amount: this.statement ? this.statement.balance : 0,
          method: 'Cash',
          reference: '',
          note: 'Consolidated Statement Receipt',
          cashier: this.$store.state.auth.fullName || this.$store.state.auth.staffId || 'Cashier'
        }
      }
      if (!targetPayment) {
        this.$toast.error('No payment found to print!')
        return
      }
      this.printReceiptData = {
        ...targetPayment,
        patientName: this.statement ? this.statement.patientName : targetPayment.patientId
      }
      await this.$nextTick()
      window.print()
    },
    printClearanceTicket() {
      if (!this.activeClearance) return
      const payment = this.statement.payments.find(p => p.reference === this.activeClearance.clearanceCode)
      if (payment) {
        this.printReceipt(payment)
      } else {
        const dummyPayment = {
          receiptNumber: 'CLR-' + this.activeClearance.clearanceCode.split('-')[1],
          paidAt: this.activeClearance.issuedAt,
          patientId: this.activeClearance.patientId,
          amount: this.activeClearance.amount,
          method: this.clearanceMethod || 'Cash',
          reference: this.activeClearance.clearanceCode,
          note: `Consultation Clearance for ${this.activeClearance.department}`,
          cashier: this.activeClearance.issuedBy
        }
        this.printReceipt(dummyPayment)
      }
    },
    formatTime(v) {
      if (!v) return ''
      return new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    fmt(v)      { return 'XAF ' + Number(v || 0).toLocaleString() },
    fmtDate(v)  { return v ? new Date(v).toLocaleDateString('fr-CM') : '—' },
    statusColor(s) {
      return { PAID: '#00A99D', PARTIAL: '#D97706', UNPAID: '#C0392B', WAIVED: '#6B7280', NO_CHARGES: '#9CA3AF' }[s] || '#9CA3AF'
    },
    chargeStatusColor(s) {
      return { Open: '#003366', Waived: '#6B7280', Cancelled: '#C0392B' }[s] || '#9CA3AF'
    }
  }
}
</script>

<style scoped>
.billing-bg { background: #F5F7F6; }
.queue-panel, .payment-panel { background: white; }
.invoice-panel { background: #F5F7F6; }
.b-right  { border-right: 1px solid #E5E7EB; }
.b-left   { border-left: 1px solid #E5E7EB; }
.b-bottom { border-bottom: 1px solid #E5E7EB; }
.b-top    { border-top: 1px solid #E5E7EB; }
.b-1      { border: 1px solid #E5E7EB; }
.bg-white { background: white !important; }
.bg-light { background: #F8FAFC !important; }
.bg-orange { background: #D97706 !important; }
.bg-navy { background: #003366 !important; }
.gov-text-primary { color: #1B1F23 !important; }
.ls-1 { letter-spacing: 0.8px; }
.uppercase { text-transform: uppercase; }

.section-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #003366;
  border-left: 3px solid #00A99D;
  padding-left: 8px;
}

.queue-item { cursor: pointer; transition: background 0.15s; }
.queue-item:hover { background: #F8FAFC; }
.queue-item--active { background: #EFF6FF !important; border-left: 3px solid #003366; }

.charge-table { width: 100%; border-collapse: collapse; }
.charge-table th {
  background: #F8FAFC;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #6B7280;
  padding: 8px 12px;
  border-bottom: 1px solid #E5E7EB;
  text-align: left;
}
.charge-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #F3F4F6;
  font-size: 12px;
}
.charge-row--muted td { opacity: 0.45; text-decoration: line-through; }

.method-chip { background: white !important; border: 1px solid #E2E8F0 !important; transition: all 0.15s; }
.method-chip:hover { border-color: #003366 !important; }
.method-chip--active { background: #003366 !important; border-color: #003366 !important; }
.method-chip--active .text-caption { color: white !important; }

.cash-tab--active { border-bottom: 2px solid #003366 !important; }

.receipt-preview { background: #F8FAFC; }

.printable-receipt-only {
  display: none;
}

@media print {
  /* Hide the rest of the application layout */
  .no-print,
  .v-navigation-drawer,
  .v-app-bar,
  .v-footer,
  .v-dialog__content,
  .v-overlay {
    display: none !important;
  }

  /* Show only the printable receipt */
  body, html {
    background: white !important;
    color: black !important;
    margin: 0 !important;
    padding: 0 !important;
    display: block !important;
  }

  .printable-receipt-only,
  .printable-receipt-only * {
    display: block !important;
  }

  .printable-receipt-only {
    display: block !important;
    position: absolute;
    left: 0;
    top: 0;
    width: 80mm;
    margin: 0 auto;
    padding: 10px;
    box-sizing: border-box;
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    color: black !important;
    background: white !important;
  }
}
</style>
