import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  Modal,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  TextInput,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { adminAPI } from '../services/api';
import Toast from 'react-native-toast-message';

const AdminAnalyticsScreen = ({ navigation }) => {
  const [analytics, setAnalytics] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(new Date());
  const [tempEndDate, setTempEndDate] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  // Load analytics on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Load analytics and dashboard data
  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsResponse, dashboardResponse] = await Promise.all([
        adminAPI.getAnalytics(dateRange),
        adminAPI.getDashboard(),
      ]);
      
      setAnalytics(analyticsResponse.data);
      setDashboard(dashboardResponse.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load analytics data',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Format date to ISO 8601 string (YYYY-MM-DD) - timezone safe
  const formatDateToISO = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };



  // Clear date filters
  const clearDateFilters = async () => {
    const clearedDateRange = {
      startDate: '',
      endDate: '',
    };
    setDateRange(clearedDateRange);
    setTempStartDate(new Date());
    setTempEndDate(new Date());
    
    // Reload data with cleared filters
    try {
      setLoading(true);
      const [analyticsResponse, dashboardResponse] = await Promise.all([
        adminAPI.getAnalytics(clearedDateRange),
        adminAPI.getDashboard(),
      ]);
      
      setAnalytics(analyticsResponse.data);
      setDashboard(dashboardResponse.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load analytics data',
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for custom date picker
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getMonthName = (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  };

  const generateCalendarDays = (year, month) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const days = [];

    // Add empty days for padding
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const handleDateSelect = (day) => {
    if (day) {
      const selectedDate = new Date(selectedYear, selectedMonth, day);
      const isStartDate = showStartDatePicker;
      
      if (isStartDate) {
        setTempStartDate(selectedDate);
        setDateRange(prev => ({
          ...prev,
          startDate: formatDateToISO(selectedDate)
        }));
      } else {
        setTempEndDate(selectedDate);
        setDateRange(prev => ({
          ...prev,
          endDate: formatDateToISO(selectedDate)
        }));
      }
      
      setShowStartDatePicker(false);
      setShowEndDatePicker(false);
    }
  };

  const openDatePicker = (isStartDate) => {
    const date = isStartDate ? tempStartDate : tempEndDate;
    setSelectedYear(date.getFullYear());
    setSelectedMonth(date.getMonth());
    setSelectedDay(date.getDate());
    
    if (isStartDate) {
      setShowStartDatePicker(true);
    } else {
      setShowEndDatePicker(true);
    }
  };

  // Format date - display in local timezone
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return '#FF9800';
      case 'APPROVED':
        return '#4CAF50';
      case 'REJECTED':
        return '#F44336';
      case 'CANCELLED':
        return '#9E9E9E';
      case 'COMPLETED':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  // Render dashboard summary cards
  const renderDashboardSummary = () => {
    if (!dashboard?.summary) return null;

    const { summary } = dashboard;
    const cards = [
      { title: 'Today', value: summary.todayRides, icon: 'today', color: '#2196F3' },
      { title: 'This Week', value: summary.weekRides, icon: 'date-range', color: '#4CAF50' },
      { title: 'This Month', value: summary.monthRides, icon: 'calendar-month', color: '#FF9800' },
      { title: 'Total Rides', value: summary.totalRides, icon: 'directions-car', color: '#9C27B0' },
      { title: 'Pending', value: summary.pendingRides, icon: 'schedule', color: '#FF9800' },
      { title: 'Approved', value: summary.approvedRides, icon: 'check-circle', color: '#4CAF50' },
    ];

    return (
      <View style={styles.summaryContainer}>
        <Title style={styles.sectionTitle}>Dashboard Summary</Title>
        <View style={styles.summaryGrid}>
          {cards.map((card, index) => (
            <Card key={index} style={styles.summaryCard}>
              <Card.Content style={styles.summaryContent}>
                <MaterialIcons name={card.icon} size={24} color={card.color} />
                <Text style={styles.summaryValue}>{card.value}</Text>
                <Text style={styles.summaryLabel}>{card.title}</Text>
              </Card.Content>
            </Card>
          ))}
        </View>
      </View>
    );
  };

  // Render analytics charts
  const renderAnalyticsCharts = () => {
    if (!analytics) return null;

    return (
      <View style={styles.analyticsContainer}>
        <Title style={styles.sectionTitle}>Analytics</Title>
        
        {/* Rides by Status */}
        <Card style={styles.analyticsCard}>
          <Card.Title title="Rides by Status" />
          <Card.Content>
            {analytics.ridesByStatus?.map((item, index) => (
              <View key={index} style={styles.statusItem}>
                <Chip
                  mode="outlined"
                  textStyle={{ color: getStatusColor(item.status) }}
                  style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
                >
                  {item.status}
                </Chip>
                <Text style={styles.statusCount}>{item.count}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Top Users */}
        <Card style={styles.analyticsCard}>
          <Card.Title title="Top Users by Ride Count" />
          <Card.Content>
            {analytics.topUsers?.slice(0, 5).map((user, index) => (
              <View key={index} style={styles.userItem}>
                <View style={styles.userInfo}>
                  <MaterialIcons name="person" size={16} color="#666" />
                  <Text style={styles.userName}>{user.user?.name}</Text>
                  <Text style={styles.userEmail}>({user.user?.email})</Text>
                </View>
                <Text style={styles.userCount}>{user.rideCount} rides</Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      </View>
    );
  };

  // Render recent activities
  const renderRecentActivities = () => {
    const recentRides = dashboard?.recentRides || [];
    const recentActions = dashboard?.recentActions || [];

    return (
      <View style={styles.recentContainer}>
        <Title style={styles.sectionTitle}>Recent Activities</Title>
        
        {/* Recent Rides */}
        <Card style={styles.recentCard}>
          <Card.Title title="Recent Rides" />
          <Card.Content>
            {recentRides.map((ride, index) => (
              <View key={index} style={styles.recentItem}>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentTitle}>
                    {ride.pickupLocation} → {ride.dropLocation}
                  </Text>
                  <Text style={styles.recentUser}>{ride.user?.name}</Text>
                  <Text style={styles.recentTime}>{formatDate(ride.createdAt)}</Text>
                </View>
                <Chip
                  mode="outlined"
                  textStyle={{ color: getStatusColor(ride.status) }}
                  style={[styles.statusChip, { borderColor: getStatusColor(ride.status) }]}
                >
                  {ride.status}
                </Chip>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Recent Admin Actions */}
        <Card style={styles.recentCard}>
          <Card.Title title="Recent Admin Actions" />
          <Card.Content>
            {recentActions.map((action, index) => (
              <View key={index} style={styles.recentItem}>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentTitle}>
                    {action.action} by {action.admin?.name}
                  </Text>
                  <Text style={styles.recentUser}>
                    {action.ride?.pickupLocation} → {action.ride?.dropLocation}
                  </Text>
                  <Text style={styles.recentTime}>{formatDate(action.createdAt)}</Text>
                </View>
                <Chip
                  mode="outlined"
                  textStyle={{ 
                    color: action.action === 'APPROVE' ? '#4CAF50' : '#F44336' 
                  }}
                  style={[styles.statusChip, { 
                    borderColor: action.action === 'APPROVE' ? '#4CAF50' : '#F44336' 
                  }]}
                >
                  {action.action}
                </Chip>
              </View>
            ))}
          </Card.Content>
        </Card>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="analytics" size={64} color="#2196F3" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Analytics Dashboard</Title>
        <Text style={styles.headerSubtitle}>
          Overview of ride requests and system statistics
        </Text>
      </View>

      {/* Date Range Filter */}
      <View style={styles.filterContainer}>
        <Title style={styles.filterTitle}>Date Range Filter</Title>
        <Paragraph style={styles.filterSubtitle}>
          Select date range to filter analytics (optional)
        </Paragraph>
        
                 <View style={styles.dateInputContainer}>
           {Platform.OS === 'web' ? (
             // Web-specific HTML date inputs
             <>
               <TextInput
                 label="Start Date"
                 value={dateRange.startDate}
                 mode="outlined"
                 style={styles.dateInput}
                 placeholder="YYYY-MM-DD"
                 onChangeText={(text) => {
                   if (text.match(/^\d{4}-\d{2}-\d{2}$/)) {
                     setDateRange(prev => ({ ...prev, startDate: text }));
                   }
                 }}
                 right={
                   <TextInput.Icon 
                     icon="calendar" 
                     onPress={() => openDatePicker(true)}
                   />
                 }
               />
               
               <TextInput
                 label="End Date"
                 value={dateRange.endDate}
                 mode="outlined"
                 style={styles.dateInput}
                 placeholder="YYYY-MM-DD"
                 onChangeText={(text) => {
                   if (text.match(/^\d{4}-\d{2}-\d{2}$/)) {
                     setDateRange(prev => ({ ...prev, endDate: text }));
                   }
                 }}
                 right={
                   <TextInput.Icon 
                     icon="calendar" 
                     onPress={() => openDatePicker(false)}
                   />
                 }
               />
             </>
           ) : (
             // Mobile-specific non-editable inputs
             <>
               <TextInput
                 label="Start Date"
                 value={dateRange.startDate}
                 mode="outlined"
                 style={styles.dateInput}
                 placeholder="YYYY-MM-DD"
                 editable={false}
                 right={
                   <TextInput.Icon 
                     icon="calendar" 
                     onPress={() => openDatePicker(true)}
                   />
                 }
               />
               
               <TextInput
                 label="End Date"
                 value={dateRange.endDate}
                 mode="outlined"
                 style={styles.dateInput}
                 placeholder="YYYY-MM-DD"
                 editable={false}
                 right={
                   <TextInput.Icon 
                     icon="calendar" 
                     onPress={() => openDatePicker(false)}
                   />
                 }
               />
             </>
           )}
         </View>

        <View style={styles.filterButtons}>
          <Button
            mode="outlined"
            onPress={clearDateFilters}
            style={styles.clearButton}
          >
            Clear Filters
          </Button>
          <Button
            mode="contained"
            onPress={loadData}
            style={styles.applyButton}
          >
            Apply Filter
          </Button>
        </View>
      </View>

      {/* Dashboard Summary */}
      {renderDashboardSummary()}

      {/* Analytics Charts */}
      {renderAnalyticsCharts()}

      {/* Recent Activities */}
      {renderRecentActivities()}

      {/* Custom Date Picker Modal */}
      {(showStartDatePicker || showEndDatePicker) && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setShowStartDatePicker(false);
            setShowEndDatePicker(false);
          }}
        >
          <View style={styles.datePickerOverlay}>
            <Card style={styles.datePickerCard}>
              <Card.Title 
                title={`Select ${showStartDatePicker ? 'Start' : 'End'} Date`}
                titleStyle={styles.datePickerTitle}
              />
              <Card.Content>
                {/* Month/Year Navigation */}
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity
                    onPress={() => {
                      if (selectedMonth === 0) {
                        setSelectedMonth(11);
                        setSelectedYear(selectedYear - 1);
                      } else {
                        setSelectedMonth(selectedMonth - 1);
                      }
                    }}
                    style={styles.navButton}
                  >
                    <MaterialIcons name="chevron-left" size={24} color="#666" />
                  </TouchableOpacity>
                  
                  <Text style={styles.monthYearText}>
                    {getMonthName(selectedMonth)} {selectedYear}
                  </Text>
                  
                  <TouchableOpacity
                    onPress={() => {
                      if (selectedMonth === 11) {
                        setSelectedMonth(0);
                        setSelectedYear(selectedYear + 1);
                      } else {
                        setSelectedMonth(selectedMonth + 1);
                      }
                    }}
                    style={styles.navButton}
                  >
                    <MaterialIcons name="chevron-right" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Calendar Grid */}
                <View style={styles.calendarGrid}>
                  {/* Day Headers */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <Text key={index} style={styles.dayHeader}>
                      {day}
                    </Text>
                  ))}

                  {/* Calendar Days */}
                  {generateCalendarDays(selectedYear, selectedMonth).map((day, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.calendarDay,
                        day === selectedDay && styles.selectedDay,
                        !day && styles.emptyDay
                      ]}
                      onPress={() => handleDateSelect(day)}
                      disabled={!day}
                    >
                      <Text style={[
                        styles.dayText,
                        day === selectedDay && styles.selectedDayText
                      ]}>
                        {day || ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Card.Content>
              <Card.Actions>
                <Button 
                  onPress={() => {
                    setShowStartDatePicker(false);
                    setShowEndDatePicker(false);
                  }}
                >
                  Cancel
                </Button>
              </Card.Actions>
            </Card>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  filterContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  filterSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  dateInputContainer: {
    marginBottom: 16,
  },
  dateInput: {
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clearButton: {
    flex: 1,
    marginRight: 8,
  },
  applyButton: {
    flex: 1,
    marginLeft: 8,
  },
  summaryContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: '48%',
    marginBottom: 12,
  },
  summaryContent: {
    alignItems: 'center',
    padding: 12,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  analyticsContainer: {
    padding: 16,
  },
  analyticsCard: {
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  statusCount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  userCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  recentContainer: {
    padding: 16,
  },
  recentCard: {
    marginBottom: 16,
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recentInfo: {
    flex: 1,
    marginRight: 8,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  recentUser: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  recentTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  // Custom Date Picker Styles
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  datePickerCard: {
    width: '100%',
    maxWidth: 350,
    elevation: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  navButton: {
    padding: 8,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dayHeader: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    paddingVertical: 8,
  },
  calendarDay: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  selectedDay: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyDay: {
    backgroundColor: 'transparent',
  },
});

export default AdminAnalyticsScreen; 