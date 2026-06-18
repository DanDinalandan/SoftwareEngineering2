import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { colors, spacing, radius } from '../../theme';
import { getLocalDateString } from '../../utils/time';

const HOUR_LABELS = ['12am','2am','4am','6am','8am','10am','12pm','2pm','4pm','6pm','8pm','10pm'];

function getRiskColor(score) {
  if (score <= 20) return colors.progressExcellent;
  if (score <= 40) return colors.progressGood;
  if (score <= 60) return colors.progressFair;
  if (score <= 80) return colors.progressPoor;
  return colors.progressCritical;
}

function getWeeklyData(moodLogs) {
  const now   = new Date();
  const week  = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = getLocalDateString(d);
    week.push(moodLogs.find((l) => l.date === dateStr) || null);
  }
  return week;
}

function generateRecommendations({ avgCraving, totalVapeMinutes, vapedDays, topTrigger, avgRisk, totalDays }) {
  const recs = [];

  if (vapedDays === 0) {
    recs.push({ text: 'Perfect week! Zero vaping days. Incredible discipline — reward yourself.' });
  } else if (vapedDays >= 5) {
    recs.push({ text: 'You vaped most days this week. Consider speaking to a cessation counselor or adjusting your goal difficulty.' });
  } else if (vapedDays >= 3) {
    recs.push({ text: 'More than half your days involved vaping. Try the Hard or Extreme goal tier next week.' });
  }

  if (avgCraving >= 7) {
    recs.push({ text: 'Your average craving was very high. Staying hydrated and doing 5-minute walks when cravings peak can significantly reduce intensity.' });
  } else if (avgCraving >= 4) {
    recs.push({ text: 'Moderate cravings detected. Box breathing (4-4-4-4 counts) practiced daily reduces cravings by up to 30%.' });
  }

  if (topTrigger) {
    recs.push({ text: `Your most common trigger this week was "${topTrigger}". Prepare a specific response plan for when this trigger appears.` });
  }

  if (totalVapeMinutes > 0 && totalVapeMinutes <= 30) {
    recs.push({ text: `Only ${totalVapeMinutes} minutes of vaping logged this week. Try cutting another 20% next week.` });
  } else if (totalVapeMinutes > 90) {
    recs.push({ text: `${totalVapeMinutes} minutes of vaping were logged this week. Focus on delaying the first vape of each day by 30 minutes.` });
  }

  if (avgRisk > 60) {
    recs.push({ text: 'Your relapse risk was elevated. Make sure your peer supporter is aware — connection is one of the strongest relapse prevention tools.' });
  }

  if (recs.length === 0) {
    recs.push({ text: 'You had a solid week. Keep logging daily — data is your best tool.' });
  }

  return recs;
}

export default function WeeklyReportScreen({ navigation }) {
  const { currentUser } = useAuth();
  const moodLogs = currentUser?.moodLogs || [];
  const [serverReport, setServerReport] = useState(null);

  useEffect(() => {
    let mounted = true;
    apiRequest('/analytics/weekly-report')
      .then((data) => mounted && setServerReport(data))
      .catch((err) => console.error('Error fetching weekly report:', err));
    return () => { mounted = false; };
  }, [currentUser?.id, moodLogs.length]);

  const weekLogs = useMemo(() => getWeeklyData(moodLogs), [moodLogs]);
  const logged   = weekLogs.filter(Boolean);

  const totalVapeMinutes = logged.reduce((s, l) => s + (l.vapeMinutes || l.puffsToday || 0), 0);
  const vapedDays   = logged.filter((l) => l.vaped).length;
  const vapeFree    = logged.filter((l) => !l.vaped).length;
  const avgCraving  = logged.length > 0
    ? (logged.reduce((s, l) => s + (l.craving || 0), 0) / logged.length).toFixed(1)
    : 0;
  const avgRisk     = logged.length > 0
    ? Math.round(logged.reduce((s, l) => s + (l.relapseRisk || 0), 0) / logged.length)
    : 0;

  // Top trigger
  const triggerCount = {};
  logged.forEach((l) => (l.triggers || []).forEach((t) => { triggerCount[t] = (triggerCount[t] || 0) + 1; }));
  const topTrigger = Object.entries(triggerCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  // Peak vaping hour
  const hourCount = {};
  logged.filter((l) => l.vaped && l.vapedHour != null).forEach((l) => {
    const h = l.vapedHour;
    hourCount[h] = (hourCount[h] || 0) + 1;
  });
  const peakHour = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const serverRecommendations = serverReport?.recommendation?.recommendations || [];
  const recs = serverReport?.ready && serverRecommendations.length
    ? serverRecommendations.map((text) => ({ text }))
    : generateRecommendations({ avgCraving: parseFloat(avgCraving), totalVapeMinutes, vapedDays, topTrigger, avgRisk, totalDays: logged.length });

  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const maxCraving = Math.max(...weekLogs.map((l) => l?.craving || 0), 1);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Weekly Report</Text>
        </View>

        {/* Summary cards */}
        <View style={styles.grid}>
          <View style={styles.gridCard}>
            <Text style={[styles.gridNum, { color: colors.progressExcellent }]}>{vapeFree}</Text>
            <Text style={styles.gridLabel}>Vape-Free Days</Text>
          </View>
          <View style={styles.gridCard}>
            <Text style={[styles.gridNum, { color: vapedDays > 0 ? colors.danger : colors.text }]}>{vapedDays}</Text>
            <Text style={styles.gridLabel}>Days Vaped</Text>
          </View>
          <View style={styles.gridCard}>
            <Text style={[styles.gridNum, { color: colors.warning }]}>{totalVapeMinutes}</Text>
            <Text style={styles.gridLabel}>Vape Minutes</Text>
          </View>
          <View style={styles.gridCard}>
            <Text style={[styles.gridNum, { color: getRiskColor(avgRisk) }]}>{avgRisk}%</Text>
            <Text style={styles.gridLabel}>Average Risk</Text>
          </View>
          <View style={styles.gridCard}>
            <Text style={styles.gridNum}>{avgCraving}</Text>
            <Text style={styles.gridLabel}>Average Craving</Text>
          </View>
          <View style={styles.gridCard}>
            <Text style={styles.gridNum}>{logged.length}/7</Text>
            <Text style={styles.gridLabel}>Days Logged</Text>
          </View>
        </View>

        {/* Craving chart */}
        <Text style={styles.sectionLabel}>Craving Intensity by Day</Text>
        <View style={styles.chartWrap}>
          {weekLogs.map((log, i) => {
            const h   = log?.craving || 0;
            const pct = h === 0 ? 0 : Math.max(8, (h / maxCraving) * 100);
            const col = h >= 7 ? colors.danger : h >= 4 ? colors.warning : colors.lavender;
            return (
              <View key={i} style={styles.barWrap}>
                <View style={[styles.bar, { height: `${pct}%`, backgroundColor: log ? col : 'rgba(170,160,187,0.15)' }]} />
                <Text style={[styles.barLabel, !log && { opacity: 0.3 }]}>{days[i]}</Text>
                {log?.vaped && <Text style={styles.vapedDot}>•</Text>}
              </View>
            );
          })}
        </View>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.danger }]} /><Text style={styles.legendText}>High craving</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.warning }]} /><Text style={styles.legendText}>Moderate</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.lavender }]} /><Text style={styles.legendText}>Low</Text></View>
          <View style={styles.legendItem}><Text style={styles.vapedDot}>•</Text><Text style={styles.legendText}>Vaped</Text></View>
        </View>

        {/* Peak vaping hour */}
        {peakHour !== null && (
          <View style={styles.peakCard}>
              <View style={{ flex: 1 }}>
              <Text style={styles.peakTitle}>Peak Vaping Hour</Text>
              <Text style={styles.peakVal}>
                {peakHour < 12
                  ? `${peakHour === 0 ? 12 : peakHour}:00 AM`
                  : `${peakHour === 12 ? 12 : peakHour - 12}:00 PM`}
              </Text>
              <Text style={styles.peakHint}>Avoid high-risk environments around this time.</Text>
            </View>
          </View>
        )}

        {/* Top trigger */}
        {topTrigger && (
          <View style={styles.triggerCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.triggerTitle}>Top Trigger This Week</Text>
              <Text style={styles.triggerVal}>{topTrigger}</Text>
            </View>
          </View>
        )}

        {/* Recommendations */}
        <Text style={styles.sectionLabel}>Recommendations for Next Week</Text>
        {!serverReport?.ready && (
          <View style={styles.notReadyCard}>
            <Text style={styles.notReadyText}>
              AI weekly recommendations unlock after 7 logged days. You have {serverReport?.loggedDays ?? logged.length}/7 this week.
            </Text>
          </View>
        )}
        {serverReport?.ready && serverReport?.recommendation?.summary ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{serverReport.recommendation.title || 'AI Weekly Summary'}</Text>
            <Text style={styles.summaryText}>{serverReport.recommendation.summary}</Text>
          </View>
        ) : null}
        {recs.map((r, i) => (
          <View key={i} style={styles.recCard}>
            <Text style={styles.recIcon}>{r.icon}</Text>
            <Text style={styles.recText}>{r.text}</Text>
          </View>
        ))}

        {/* Comments from this week */}
        {logged.filter((l) => l.comment).length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Your Notes This Week</Text>
            {logged.filter((l) => l.comment).map((l, i) => (
              <View key={i} style={styles.noteCard}>
                <Text style={styles.noteDate}>{l.date}</Text>
                <Text style={styles.noteText}>"{l.comment}"</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.lg, marginBottom: spacing.lg, gap: 10 },
  back: { fontSize: 28, color: colors.lilacAsh },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, color: colors.textMuted, textTransform: 'uppercase', marginBottom: 12, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  gridCard: { width: '31%', backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 12, alignItems: 'center' },
  gridNum: { fontSize: 20, fontWeight: '800', color: colors.text },
  gridLabel: { fontSize: 9, color: colors.textMuted, marginTop: 3, textAlign: 'center', lineHeight: 13 },
  chartWrap: { flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 4, marginBottom: 8 },
  barWrap: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '80%', borderRadius: 4 },
  barLabel: { fontSize: 8, color: colors.textMuted, marginTop: 4 },
  vapedDot: { fontSize: 14, color: colors.danger, lineHeight: 16 },
  chartLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: colors.textMuted },
  peakCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10 },
  peakIcon: { fontSize: 22 },
  peakTitle: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginBottom: 3 },
  peakVal: { fontSize: 18, fontWeight: '800', color: colors.lavender, marginBottom: 3 },
  peakHint: { fontSize: 11, color: colors.textMuted, lineHeight: 16 },
  triggerCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 16 },
  triggerIcon: { fontSize: 22 },
  triggerTitle: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginBottom: 3 },
  triggerVal: { fontSize: 18, fontWeight: '800', color: colors.warning },
  recCard: { flexDirection: 'row', gap: 10, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 8, alignItems: 'flex-start' },
  recIcon: { fontSize: 20 },
  recText: { flex: 1, fontSize: 13, color: colors.bone, lineHeight: 19 },
  notReadyCard: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 8 },
  notReadyText: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  summaryCard: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.lavender + '50', padding: 14, marginBottom: 8 },
  summaryTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 5 },
  summaryText: { fontSize: 13, color: colors.bone, lineHeight: 19 },
  noteCard: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: colors.lavender },
  noteDate: { fontSize: 10, color: colors.textMuted, marginBottom: 4 },
  noteText: { fontSize: 13, color: colors.bone, fontStyle: 'italic', lineHeight: 19 },
});
