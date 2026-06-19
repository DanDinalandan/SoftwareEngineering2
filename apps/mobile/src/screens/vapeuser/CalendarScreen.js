import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Modal, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { BottomNav } from '../../components';
import { colors, spacing, radius } from '../../theme';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function buildCalendar(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const cells = [];
  // prev month overflow
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, current: false });
  // current month
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true });
  // next month overflow
  let next = 1;
  while (cells.length % 7 !== 0) cells.push({ day: next++, current: false });
  return cells;
}

export default function CalendarScreen({ navigation }) {
  const { currentUser, deleteLogEntry } = useAuth();
  const moodLogs = currentUser?.moodLogs || [];

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // entry id to delete
  const [showDeleted, setShowDeleted] = useState(false);

  const cells = buildCalendar(viewYear, viewMonth);

  const logMap = {};
  moodLogs.forEach((l) => { logMap[l.date] = l; });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDate(null);
  };

  const handleDayPress = (cell) => {
    if (!cell.current) return;
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(cell.day).padStart(2,'0')}`;
    setSelectedDate(dateStr);
  };

  const selectedLog = selectedDate ? logMap[selectedDate] : null;

  const moodColor = (mood) => ({
    Great: colors.success, Good: '#9FD08A', Okay: colors.warning,
    Bad: '#E09A70', Awful: colors.danger,
  }[mood] || colors.textMuted);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Journey Calendar</Text>
        </View>

        {/* Stats strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{currentUser?.streak || 0}</Text>
            <Text style={styles.statLbl}>Day Streak</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{moodLogs.filter(l => !l.vaped).length}</Text>
            <Text style={styles.statLbl}>Vape-Free Days</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{moodLogs.length}</Text>
            <Text style={styles.statLbl}>Total Logs</Text>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calCard}>
          {/* Nav */}
          <View style={styles.calNav}>
            <TouchableOpacity onPress={prevMonth} style={styles.navArrowBtn}>
              <Text style={styles.navArrow}>‹</Text>
            </TouchableOpacity>
            <View style={styles.calNavCenter}>
              <Text style={styles.calMonth}>{MONTHS[viewMonth]}</Text>
              <Text style={styles.calYear}>{viewYear}</Text>
            </View>
            <TouchableOpacity onPress={nextMonth} style={styles.navArrowBtn}>
              <Text style={styles.navArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={styles.dayHeaderRow}>
            {DAYS.map(d => <Text key={d} style={styles.dayHeader}>{d}</Text>)}
          </View>

          {/* Cells */}
          <View style={styles.grid}>
            {cells.map((cell, i) => {
              const dateStr = cell.current
                ? `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(cell.day).padStart(2,'0')}`
                : null;
              const log = dateStr ? logMap[dateStr] : null;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const isVapeFree = log && !log.vaped;
              const isVaped = log && log.vaped;

              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.cell,
                    !cell.current && styles.cellInactive,
                    isToday && styles.cellToday,
                    isSelected && styles.cellSelected,
                    isVapeFree && styles.cellVapeFree,
                    isVaped && styles.cellVaped,
                  ]}
                  onPress={() => handleDayPress(cell)}
                  activeOpacity={cell.current ? 0.7 : 1}
                  disabled={!cell.current}
                >
                  <Text style={[
                    styles.cellText,
                    !cell.current && styles.cellTextInactive,
                    (isToday || isSelected) && styles.cellTextHighlight,
                    isVapeFree && styles.cellTextVapeFree,
                  ]}>
                    {cell.day}
                  </Text>
                  {isVapeFree && <View style={[styles.statusDot, styles.statusDotLeft, { backgroundColor: colors.success }]} />}
                  {isVaped && <View style={[styles.statusDot, styles.statusDotLeft, { backgroundColor: colors.danger }]} />}
                  {isToday && <View style={[styles.statusDot, styles.statusDotRight, { backgroundColor: colors.lavender }]} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.success }]} /><Text style={styles.legendText}>Vape-free</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.danger }]} /><Text style={styles.legendText}>Vaped</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.lavender }]} /><Text style={styles.legendText}>Today</Text></View>
          </View>
        </View>

        {/* Selected day log */}
        {selectedDate && (
          <View style={styles.logCard}>
            {selectedLog ? (
              <>
                <View style={styles.logCardHeader}>
                  <View>
                    <Text style={styles.logMood}>
                      Logged mood: <Text style={{ color: moodColor(selectedLog.mood) }}>{selectedLog.mood?.toLowerCase()}</Text>
                    </Text>
                    <Text style={styles.logTime}>{selectedLog.timestamp}</Text>
                  </View>
                  <View style={styles.logActions}>
                    <TouchableOpacity onPress={() => setConfirmDelete(selectedLog.id)} style={styles.actionBtn}>
                      <Text style={styles.deleteIcon}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.logDetails}>
                  <Text style={styles.logDetailItem}>Craving: {selectedLog.craving}/10</Text>
                  <Text style={styles.logDetailItem}>Vaped: {selectedLog.vaped ? 'Yes' : 'No'}</Text>
                  {selectedLog.triggers?.length > 0 && (
                    <Text style={styles.logDetailItem}>Triggers: {selectedLog.triggers.join(', ')}</Text>
                  )}
                  <Text style={styles.logDetailItem}>Points earned: +{selectedLog.points}</Text>
                  <Text style={[styles.logDetailItem, { color: selectedLog.relapseRisk > 60 ? colors.danger : selectedLog.relapseRisk > 30 ? colors.warning : colors.success }]}>
                    Relapse risk: {selectedLog.relapseRisk}%
                  </Text>
                </View>
              </>
            ) : (
              <Text style={styles.noLog}>No entry logged for this day.</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Delete confirm modal */}
      <Modal transparent visible={!!confirmDelete} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Are you sure you{'\n'}want to delete?</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalBtnNo} onPress={() => setConfirmDelete(null)}>
                <Text style={styles.modalBtnNoText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnYes}
                onPress={() => {
                  deleteLogEntry(confirmDelete);
                  setConfirmDelete(null);
                  setSelectedDate(null);
                  setShowDeleted(true);
                  setTimeout(() => setShowDeleted(false), 2000);
                }}
              >
                <Text style={styles.modalBtnText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Deleted success modal */}
      <Modal transparent visible={showDeleted} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Deleted{'\n'}Successfully</Text>
            <TouchableOpacity style={styles.modalBtnYes} onPress={() => setShowDeleted(false)}>
              <Text style={styles.modalBtnText}>Ok</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomNav active="Dashboard" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.lg, marginBottom: spacing.lg, gap: 10 },
  backArrow: { fontSize: 28, color: colors.lilacAsh },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  statsStrip: { flexDirection: 'row', backgroundColor: colors.cardSolid, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginBottom: 16, overflow: 'hidden' },
  statItem: { flex: 1, alignItems: 'center', padding: 14 },
  statNum: { fontSize: 20, fontWeight: '800', color: colors.lavender },
  statLbl: { fontSize: 10, color: colors.textMuted, marginTop: 2, textAlign: 'center', fontWeight: '600' },
  statDiv: { width: 1, backgroundColor: colors.border, marginVertical: 10 },
  calCard: { backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 16 },
  calNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  calNavCenter: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  calMonth: { fontSize: 16, fontWeight: '700', color: colors.text },
  calYear: { fontSize: 16, fontWeight: '700', color: colors.lavender },
  navArrowBtn: { padding: 6 },
  navArrow: { fontSize: 22, color: colors.lavender, fontWeight: '700' },
  dayHeaderRow: { flexDirection: 'row', marginBottom: 6 },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 11, color: colors.textMuted, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, marginVertical: 2 },
  cellInactive: { opacity: 0.25 },
  cellToday: { backgroundColor: colors.lavender },
  cellSelected: { borderWidth: 2, borderColor: colors.lavender },
  cellVapeFree: { backgroundColor: 'rgba(126,200,160,0.2)' },
  cellVaped: { backgroundColor: 'rgba(224,112,112,0.18)' },
  cellText: { fontSize: 13, color: colors.text, fontWeight: '500' },
  cellTextInactive: { color: colors.textMuted },
  cellTextHighlight: { color: colors.porcelain, fontWeight: '800' },
  cellTextVapeFree: { fontWeight: '700' },
  statusDot: { width: 5, height: 5, borderRadius: 3, position: 'absolute', bottom: 3 },
  statusDotLeft: { left: '38%' },
  statusDotRight: { right: '38%' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: colors.textMuted },
  logCard: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 16 },
  logCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  logMood: { fontSize: 14, fontWeight: '600', color: colors.text },
  logTime: { fontSize: 11, color: colors.textMuted, marginTop: 3 },
  logActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { padding: 4 },
  deleteIcon: { fontSize: 12, color: colors.danger, fontWeight: '800' },
  logDetails: { gap: 4 },
  logDetailItem: { fontSize: 13, color: colors.text },
  noLog: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,5,25,0.8)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, padding: 28, width: '80%', alignItems: 'center', gap: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center', lineHeight: 26 },
  modalBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtnNo: { flex: 1, paddingVertical: 12, backgroundColor: colors.cardSolid, borderRadius: radius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  modalBtnYes: { flex: 1, paddingVertical: 12, backgroundColor: colors.frenchBlue, borderRadius: radius.md, alignItems: 'center' },
  modalBtnNoText: { color: colors.text, fontWeight: '700', fontSize: 14 },
  modalBtnText: { color: colors.porcelain, fontWeight: '700', fontSize: 14 },
});
