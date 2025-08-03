import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  TextInput,
  Menu,
  Divider,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { adminAPI } from '../services/api';
import Toast from 'react-native-toast-message';

const AdminAllRidesScreen = ({ navigation }) => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [action, setAction] = useState('');
  const [reason, setReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    startDate: '',
    endDate: '',
    username: '',
  });

  // Applied filters state (what's actually being used for API calls)
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: '',
    startDate: '',
    endDate: '',
    username: '',
  });

  // Load rides on component mount
  useEffect(() => {
    loadRides();
  }, [appliedFilters]);

  // Load rides from API
  const loadRides = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 100, // Show more rides at once
        ...appliedFilters,
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await adminAPI.getAllRides(params);
      setRides(response.data.rides);
    } catch (error) {
      console.error('Error loading rides:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load rides',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRides();
  }, [appliedFilters]);

  // Handle filter changes (only updates the form, doesn't apply)
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Apply filters
  const applyFilters = () => {
    setAppliedFilters(filters);
  };

  // Clear all filters
  const clearFilters = () => {
    const emptyFilters = {
      search: '',
      status: '',
      startDate: '',
      endDate: '',
      username: '',
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  // Format date
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

  // Handle ride action (approve/reject/complete)
  const handleRideAction = (ride, actionType) => {
    setSelectedRide(ride);
    setAction(actionType);
    setReason('');
    setShowActionDialog(true);
  };

  const confirmAction = async () => {
    if (!selectedRide || !action) return;

    setProcessingAction(true);
    try {
      await adminAPI.updateRideStatus(selectedRide.id, action, reason);
      
      Toast.show({
        type: 'success',
        text1: `Ride ${action === 'APPROVE' ? 'Approved' : action === 'REJECT' ? 'Rejected' : 'Completed'}!`,
        text2: `The ride has been ${action.toLowerCase()}d successfully`,
      });

      // Refresh the rides list
      loadRides();
      
      setShowActionDialog(false);
      setSelectedRide(null);
      setAction('');
      setReason('');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to process ride action';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const cancelAction = () => {
    setShowActionDialog(false);
    setSelectedRide(null);
    setAction('');
    setReason('');
  };

  // Render ride item
  const renderRideItem = ({ item }) => (
    <Card style={styles.rideCard} mode="outlined">
      <Card.Content>
        <View style={styles.rideHeader}>
          <View style={styles.rideInfo}>
            <Title style={styles.rideTitle}>
              {item.pickupLocation} → {item.dropLocation}
            </Title>
            <Paragraph style={styles.rideTime}>
              {formatDate(item.scheduledTime)}
            </Paragraph>
          </View>
          <Chip
            mode="outlined"
            textStyle={{ color: getStatusColor(item.status) }}
            style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
          >
            {item.status}
          </Chip>
        </View>

        <View style={styles.userInfo}>
          <MaterialIcons name="person" size={16} color="#666" />
          <Paragraph style={styles.userText}>
            {item.user?.name} ({item.user?.email})
          </Paragraph>
        </View>

        {item.user?.company && (
          <View style={styles.userInfo}>
            <MaterialIcons name="business" size={16} color="#666" />
            <Paragraph style={styles.userText}>{item.user.company}</Paragraph>
          </View>
        )}

        {item.purpose && (
          <View style={styles.userInfo}>
            <MaterialIcons name="event" size={16} color="#666" />
            <Paragraph style={styles.userText}>{item.purpose}</Paragraph>
          </View>
        )}

        {item.notes && (
          <View style={styles.userInfo}>
            <MaterialIcons name="note" size={16} color="#666" />
            <Paragraph style={styles.userText}>{item.notes}</Paragraph>
          </View>
        )}

                 {/* Show action buttons based on ride status */}
         <View style={styles.rideActions}>
           {item.status === 'PENDING' && (
             <>
               <Button
                 mode="contained"
                 onPress={() => handleRideAction(item, 'APPROVE')}
                 style={[styles.actionButton, styles.approveButton]}
                 buttonColor="#4CAF50"
               >
                 Approve
               </Button>
               
               <Button
                 mode="contained"
                 onPress={() => handleRideAction(item, 'REJECT')}
                 style={[styles.actionButton, styles.rejectButton]}
                 buttonColor="#F44336"
               >
                 Reject
               </Button>
               
               <Button
                 mode="outlined"
                 onPress={() => handleRideAction(item, 'CANCEL')}
                 style={[styles.actionButton, styles.cancelButton]}
               >
                 Cancel
               </Button>
             </>
           )}
         </View>
      </Card.Content>
    </Card>
  );

  // Render filter section
  const renderFilters = () => (
    <Card style={styles.filterCard} mode="outlined">
      <Card.Content>
        <View style={styles.filterHeader}>
          <View style={styles.filterTitleContainer}>
            <Title style={styles.filterTitle}>Filters</Title>
            {JSON.stringify(filters) !== JSON.stringify(appliedFilters) && (
              <View style={styles.modifiedIndicator}>
                <Text style={styles.modifiedText}>Modified</Text>
              </View>
            )}
          </View>
                     <View style={styles.filterHeaderButtons}>
             <Button
               mode="outlined"
               onPress={applyFilters}
               style={styles.applyButton}
               buttonColor="#4CAF50"
               textColor="#000000"
             >
               Apply
             </Button>
             <Button
               mode="text"
               onPress={clearFilters}
               textColor="#666"
             >
               Clear All
             </Button>
           </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Search Filter */}
          <TextInput
            label="Search (Location, Purpose, Notes)"
            value={filters.search}
            onChangeText={(text) => handleFilterChange('search', text)}
            mode="outlined"
            style={styles.filterInput}
            left={<TextInput.Icon icon="magnify" />}
          />

          {/* Username Filter */}
          <TextInput
            label="Username"
            value={filters.username}
            onChangeText={(text) => handleFilterChange('username', text)}
            mode="outlined"
            style={styles.filterInput}
            left={<TextInput.Icon icon="account" />}
          />

          {/* Status Filter */}
          <View style={styles.statusFilterContainer}>
            <Text style={styles.filterLabel}>Status:</Text>
            <View style={styles.statusButtons}>
                             {['', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'].map((status) => (
                 <Button
                   key={status}
                   mode={filters.status === status ? 'contained' : 'outlined'}
                   onPress={() => handleFilterChange('status', status)}
                   style={styles.statusButton}
                   buttonColor={getStatusColor(status)}
                   textColor={filters.status === status ? '#FFFFFF' : '#000000'}
                   compact
                 >
                   {status || 'All'}
                 </Button>
               ))}
            </View>
          </View>

          {/* Date Range Filters */}
          <View style={styles.dateFilterContainer}>
            <Text style={styles.filterLabel}>Date Range:</Text>
            <TextInput
              label="Start Date (YYYY-MM-DD)"
              value={filters.startDate}
              onChangeText={(text) => handleFilterChange('startDate', text)}
              mode="outlined"
              style={styles.filterInput}
              left={<TextInput.Icon icon="calendar-start" />}
              placeholder="2024-01-01"
            />
            <TextInput
              label="End Date (YYYY-MM-DD)"
              value={filters.endDate}
              onChangeText={(text) => handleFilterChange('endDate', text)}
              mode="outlined"
              style={styles.filterInput}
              left={<TextInput.Icon icon="calendar-end" />}
              placeholder="2024-12-31"
            />
          </View>
        </ScrollView>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Title style={styles.headerTitle}>All Rides</Title>
        <Text style={styles.headerSubtitle}>
          View and manage all ride requests
        </Text>
      </View>

      {/* Filter Toggle */}
      <View style={styles.filterToggleContainer}>
        <Button
          mode="outlined"
          onPress={() => setShowFilters(!showFilters)}
          icon={showFilters ? 'chevron-up' : 'chevron-down'}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
          {Object.values(appliedFilters).some(f => f !== '') && (
            <View style={styles.filterIndicator} />
          )}
        </Button>
      </View>

      {/* Filters Section */}
      {showFilters && renderFilters()}



      {/* Rides List */}
      <FlatList
        data={rides}
        renderItem={renderRideItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="directions-car" size={64} color="#666" />
            <Text style={styles.emptyText}>No rides found</Text>
            <Text style={styles.emptySubtext}>
              {Object.values(appliedFilters).some(f => f !== '') 
                ? 'No rides match your filter criteria'
                : 'No rides have been created yet'
              }
            </Text>
          </View>
        }
      />

      {/* Action Confirmation Dialog */}
      <Modal
        visible={showActionDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelAction}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
                         <Card.Title 
               title={`${action === 'APPROVE' ? 'Approve' : 
                      action === 'REJECT' ? 'Reject' : 'Cancel'} Ride`}
               titleStyle={{ 
                 color: action === 'APPROVE' ? '#4CAF50' : 
                        action === 'REJECT' ? '#F44336' : '#9E9E9E'
               }}
             />
            <Card.Content>
              <Paragraph style={styles.modalText}>
                Are you sure you want to {action.toLowerCase()} this ride request?
              </Paragraph>
              
              {selectedRide && (
                <View style={styles.rideDetails}>
                  <Text style={styles.rideDetailLabel}>From: </Text>
                  <Text style={styles.rideDetailText}>{selectedRide.pickupLocation}</Text>
                  {'\n'}
                  <Text style={styles.rideDetailLabel}>To: </Text>
                  <Text style={styles.rideDetailText}>{selectedRide.dropLocation}</Text>
                  {'\n'}
                  <Text style={styles.rideDetailLabel}>User: </Text>
                  <Text style={styles.rideDetailText}>{selectedRide.user?.name}</Text>
                  {'\n'}
                  <Text style={styles.rideDetailLabel}>Status: </Text>
                  <Text style={styles.rideDetailText}>{selectedRide.status}</Text>
                </View>
              )}

              <TextInput
                label="Reason (Optional)"
                value={reason}
                onChangeText={setReason}
                mode="outlined"
                style={styles.reasonInput}
                multiline
                numberOfLines={3}
                placeholder={`Enter reason for ${action.toLowerCase()}ing this ride...`}
              />
            </Card.Content>
            <Card.Actions>
              <Button onPress={cancelAction}>Cancel</Button>
                             <Button
                 onPress={confirmAction}
                 mode="contained"
                 buttonColor={
                   action === 'APPROVE' ? '#4CAF50' : 
                   action === 'REJECT' ? '#F44336' : '#9E9E9E'
                 }
                 loading={processingAction}
                 disabled={processingAction}
               >
                 {action === 'APPROVE' ? 'Approve' : 
                  action === 'REJECT' ? 'Reject' : 'Cancel'}
               </Button>
            </Card.Actions>
          </Card>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  filterToggleContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginLeft: 8,
  },
  filterCard: {
    margin: 16,
    marginTop: 0,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  applyButton: {
    marginRight: 8,
  },
  filterTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modifiedIndicator: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  modifiedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  filterInput: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  statusFilterContainer: {
    marginBottom: 16,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    marginBottom: 8,
  },
  dateFilterContainer: {
    marginBottom: 16,
  },
  resultsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
  },
  paginationText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
  },
  rideCard: {
    marginBottom: 16,
    elevation: 2,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  rideInfo: {
    flex: 1,
    marginRight: 8,
  },
  rideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rideTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  rideActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: 80,
  },
  approveButton: {
    marginRight: 4,
  },
  rejectButton: {
    marginLeft: 4,
  },
  completeButton: {
    marginRight: 4,
  },
  cancelButton: {
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    elevation: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginVertical: 8,
  },
  rideDetails: {
    marginVertical: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  rideDetailLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  rideDetailText: {
    color: '#666',
  },
  reasonInput: {
    marginTop: 12,
  },
});

export default AdminAllRidesScreen; 