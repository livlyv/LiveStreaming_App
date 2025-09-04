import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { logger, LogEntry } from '@/lib/logger';
import { X, Download, Trash2, Filter } from 'lucide-react-native';

interface LogViewerProps {
  visible: boolean;
  onClose: () => void;
}

export default function LogViewer({ visible, onClose }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    if (visible) {
      refreshLogs();
    }
  }, [visible]);

  const refreshLogs = () => {
    const allLogs = logger.getLogs();
    setLogs(allLogs);
  };

  const filteredLogs = logs.filter(log => {
    const matchesFilter = !filter || 
      log.message.toLowerCase().includes(filter.toLowerCase()) ||
      log.data?.endpoint?.toLowerCase().includes(filter.toLowerCase());
    
    const matchesLevel = selectedLevel === 'ALL' || log.level === selectedLevel;
    const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
    
    return matchesFilter && matchesLevel && matchesCategory;
  });

  const exportLogs = () => {
    const logData = logger.exportLogs();
    console.log('=== EXPORTED LOGS ===');
    console.log(logData);
    console.log('=== END LOGS ===');
  };

  const clearLogs = () => {
    logger.clearLogs();
    refreshLogs();
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return '#FF4444';
      case 'WARN': return '#FFAA00';
      case 'INFO': return '#44AAFF';
      case 'DEBUG': return '#888888';
      default: return '#FFFFFF';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'AUTH': return '#FF6B6B';
      case 'API': return '#4ECDC4';
      case 'NAVIGATION': return '#45B7D1';
      case 'UI': return '#96CEB4';
      case 'STORAGE': return '#FFEAA7';
      case 'NETWORK': return '#DDA0DD';
      default: return '#FFFFFF';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Debug Logs</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={refreshLogs} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>Refresh</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={exportLogs} style={styles.headerButton}>
              <Download size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={clearLogs} style={styles.headerButton}>
              <Trash2 size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filters}>
          <TextInput
            style={styles.filterInput}
            placeholder="Filter logs..."
            placeholderTextColor="#888"
            value={filter}
            onChangeText={setFilter}
          />
          
          <View style={styles.filterButtons}>
            {['ALL', 'ERROR', 'WARN', 'INFO', 'DEBUG'].map(level => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.filterButton,
                  selectedLevel === level && styles.filterButtonActive
                ]}
                onPress={() => setSelectedLevel(level)}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedLevel === level && styles.filterButtonTextActive
                ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filterButtons}>
            {['ALL', 'AUTH', 'API', 'NAVIGATION', 'UI', 'STORAGE', 'NETWORK'].map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.filterButton,
                  selectedCategory === category && styles.filterButtonActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedCategory === category && styles.filterButtonTextActive
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ScrollView style={styles.logsContainer}>
          {filteredLogs.length === 0 ? (
            <Text style={styles.noLogs}>No logs found</Text>
          ) : (
            filteredLogs.map((log, index) => (
              <View key={index} style={styles.logEntry}>
                <View style={styles.logHeader}>
                  <Text style={[styles.logLevel, { color: getLevelColor(log.level) }]}>
                    {log.level}
                  </Text>
                  <Text style={[styles.logCategory, { color: getCategoryColor(log.category) }]}>
                    {log.category}
                  </Text>
                  <Text style={styles.logTime}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={styles.logMessage}>{log.message}</Text>
                {log.data && (
                  <Text style={styles.logData}>
                    {JSON.stringify(log.data, null, 2)}
                  </Text>
                )}
                {log.error && (
                  <Text style={styles.logError}>
                    Error: {log.error.message}
                  </Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070506',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  closeButton: {
    backgroundColor: 'rgba(255,0,0,0.2)',
    padding: 8,
    borderRadius: 6,
  },
  filters: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  filterInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  filterButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  filterButtonActive: {
    backgroundColor: '#E30CBD',
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  filterButtonTextActive: {
    fontWeight: 'bold',
  },
  logsContainer: {
    flex: 1,
    padding: 16,
  },
  noLogs: {
    color: '#888',
    textAlign: 'center',
    marginTop: 50,
  },
  logEntry: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#E30CBD',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  logLevel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  logCategory: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  logTime: {
    fontSize: 10,
    color: '#888',
    marginLeft: 'auto',
  },
  logMessage: {
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 4,
  },
  logData: {
    color: '#AAA',
    fontSize: 10,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  logError: {
    color: '#FF4444',
    fontSize: 10,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(255,68,68,0.1)',
    padding: 4,
    borderRadius: 4,
    marginTop: 4,
  },
});
