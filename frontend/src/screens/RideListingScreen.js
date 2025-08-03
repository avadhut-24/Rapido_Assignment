import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  FAB,
  TextInput,
  Menu,
  Divider,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { rideAPI } from '../services/api';
import Toast from 'react-native-toast-message';

const RideListingScreen = ({ navigation }) => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [menuVisible, setMenuVisible] = useState(false);
  const [previousRideStatuses, setPreviousRideStatuses] = useState({});
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [rideToCancel, setRideToCancel] = useState(null);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  
  const { user } = useAuth();

  // Load rides on component mount
  useEffect(() => {
    loadRides();
    // Set up real-time updates (polling every 30 seconds)
    const interval = setInterval(loadRides, 30000);
    return () => clearInterval(interval);
  }, []);

  // Track if we should refresh on focus (set to true when navigating to CreateRide)
  const [shouldRefreshOnFocus, setShouldRefreshOnFocus] = useState(false);

  // Refresh rides when screen comes into focus (e.g., after creating a new ride)
  useFocusEffect(
    useCallback(() => {
      // Only refresh if we should and we're not already loading
      if (shouldRefreshOnFocus && !loading) {
        setShouldRefreshOnFocus(false); // Reset the flag
        loadRides();
      }
    }, [shouldRefreshOnFocus, loading])
  );



  // Load rides from API
  const loadRides = async () => {
    try {
      setLoading(true);
      const response = await rideAPI.getUserRides();
      setRides(response.data.rides);
      
      // Check for status changes and show notifications
      checkStatusChanges(response.data.rides);
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

  // Check for status changes and show notifications
  const checkStatusChanges = (newRides) => {
    newRides.forEach(ride => {
      const previousStatus = previousRideStatuses[ride.id];
      
      // Only show notification if status has actually changed
      if (previousStatus && previousStatus !== ride.status) {
        if (ride.status === 'APPROVED') {
          Toast.show({
            type: 'success',
            text1: 'Ride Approved! 🎉',
            text2: `Your ride from ${ride.pickupLocation} has been approved`,
          });
        } else if (ride.status === 'REJECTED') {
          Toast.show({
            type: 'error',
            text1: 'Ride Rejected',
            text2: `Your ride request has been rejected`,
          });
        } else if (ride.status === 'COMPLETED') {
          Toast.show({
            type: 'info',
            text1: 'Ride Completed',
            text2: `Your ride has been completed successfully`,
          });
        }
      }
    });
    
    // Update the previous statuses for next comparison
    const newStatuses = {};
    newRides.forEach(ride => {
      newStatuses[ride.id] = ride.status;
    });
    setPreviousRideStatuses(newStatuses);
  };

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRides();
  }, []);

  // Filter rides based on search and status
  const filteredRides = rides.filter(ride => {
    const matchesSearch = 
      ride.pickupLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.dropLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.purpose?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || ride.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle ride cancellation
  const handleCancelRide = (ride) => {
    setRideToCancel(ride);
    setShowCancelDialog(true);
  };

  const confirmCancelRide = async () => {
    if (!rideToCancel) return;
    
    try {
      await rideAPI.cancelRide(rideToCancel.id);
      Toast.show({
        type: 'success',
        text1: 'Ride Cancelled',
        text2: 'Your ride has been cancelled successfully',
      });
      loadRides();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to cancel ride';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
    } finally {
      setShowCancelDialog(false);
      setRideToCancel(null);
    }
  };

  const cancelCancelRide = () => {
    setShowCancelDialog(false);
    setRideToCancel(null);
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

        {item.purpose && (
          <Paragraph style={styles.ridePurpose}>
            <MaterialIcons name="business" size={16} color="#666" />
            {' '}{item.purpose}
          </Paragraph>
        )}

        {item.notes && (
          <Paragraph style={styles.rideNotes}>
            <MaterialIcons name="note" size={16} color="#666" />
            {' '}{item.notes}
          </Paragraph>
        )}

                 <View style={styles.rideActions}>
                       <Button
              mode="outlined"
              onPress={() => {
                setShouldRefreshOnFocus(true); // Set flag before navigating
                navigation.navigate('RideDetail', { ride: item });
              }}
              style={styles.actionButton}
            >
              View Details
            </Button>
           
                       {item.status === 'PENDING' && (
              <Button
                mode="outlined"
                onPress={() => {
                  setShouldRefreshOnFocus(true); // Set flag before navigating
                  navigation.navigate('EditRide', { ride: item });
                }}
                style={styles.actionButton}
              >
                Edit
              </Button>
            )}
          
          {['PENDING', 'APPROVED'].includes(item.status) && (
            <Button
              mode="outlined"
              onPress={() => handleCancelRide(item)}
              style={[styles.actionButton, styles.cancelButton]}
              textColor="#F44336"
            >
              Cancel
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Title style={styles.headerTitle}>My Rides</Title>
        <Text style={styles.headerSubtitle}>
          Welcome back, {user?.name}!
        </Text>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search rides..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          mode="outlined"
        />
        
        <Button
          mode="outlined"
          onPress={() => setShowFilterDialog(true)}
          style={styles.filterButton}
        >
          Filter: {statusFilter}
        </Button>
      </View>

      {/* Rides List */}
      <FlatList
        data={filteredRides}
        renderItem={renderRideItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="directions-car" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No rides found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || statusFilter !== 'ALL' 
                ? 'Try adjusting your search or filter'
                : 'Create your first ride request!'
              }
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          setShouldRefreshOnFocus(true); // Set flag before navigating
          navigation.navigate('CreateRide');
        }}
        label="New Ride"
      />

      {/* Cancel Ride Confirmation Dialog */}
      <Modal
        visible={showCancelDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelCancelRide}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <Card.Title title="Cancel Ride" />
            <Card.Content>
              <Paragraph style={styles.modalText}>
                Are you sure you want to cancel this ride? This action cannot be undone.
              </Paragraph>
              {rideToCancel && (
                <Paragraph style={styles.rideInfo}>
                  <Text style={styles.rideInfoLabel}>From: </Text>
                  {rideToCancel.pickupLocation}
                  {'\n'}
                  <Text style={styles.rideInfoLabel}>To: </Text>
                  {rideToCancel.dropLocation}
                </Paragraph>
              )}
            </Card.Content>
            <Card.Actions>
              <Button onPress={cancelCancelRide}>No, Keep Ride</Button>
              <Button
                onPress={confirmCancelRide}
                mode="contained"
                buttonColor="#F44336"
              >
                Yes, Cancel Ride
              </Button>
            </Card.Actions>
          </Card>
                 </View>
       </Modal>

       {/* Filter Dialog */}
       <Modal
         visible={showFilterDialog}
         transparent={true}
         animationType="fade"
         onRequestClose={() => setShowFilterDialog(false)}
       >
         <View style={styles.modalOverlay}>
           <Card style={styles.modalCard}>
             <Card.Title title="Filter Rides" />
             <Card.Content>
               <Paragraph style={styles.modalText}>
                 Select a status to filter your rides:
               </Paragraph>
               <View style={styles.filterOptions}>
                 <Button
                   mode={statusFilter === 'ALL' ? 'contained' : 'outlined'}
                   onPress={() => {
                     setStatusFilter('ALL');
                     setShowFilterDialog(false);
                   }}
                   style={styles.filterOption}
                 >
                   All Rides
                 </Button>
                 <Button
                   mode={statusFilter === 'PENDING' ? 'contained' : 'outlined'}
                   onPress={() => {
                     setStatusFilter('PENDING');
                     setShowFilterDialog(false);
                   }}
                   style={styles.filterOption}
                 >
                   Pending
                 </Button>
                 <Button
                   mode={statusFilter === 'APPROVED' ? 'contained' : 'outlined'}
                   onPress={() => {
                     setStatusFilter('APPROVED');
                     setShowFilterDialog(false);
                   }}
                   style={styles.filterOption}
                 >
                   Approved
                 </Button>
                 <Button
                   mode={statusFilter === 'COMPLETED' ? 'contained' : 'outlined'}
                   onPress={() => {
                     setStatusFilter('COMPLETED');
                     setShowFilterDialog(false);
                   }}
                   style={styles.filterOption}
                 >
                   Completed
                 </Button>
                 <Button
                   mode={statusFilter === 'CANCELLED' ? 'contained' : 'outlined'}
                   onPress={() => {
                     setStatusFilter('CANCELLED');
                     setShowFilterDialog(false);
                   }}
                   style={styles.filterOption}
                 >
                   Cancelled
                 </Button>
               </View>
             </Card.Content>
             <Card.Actions>
               <Button onPress={() => setShowFilterDialog(false)}>Cancel</Button>
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
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    flex: 1,
    marginRight: 8,
  },
  filterButton: {
    minWidth: 100,
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
    marginBottom: 8,
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
  ridePurpose: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  rideNotes: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  rideActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  actionButton: {
    marginRight: 8,
    marginBottom: 4,
  },
  cancelButton: {
    borderColor: '#F44336',
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
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
  rideInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  rideInfoLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  filterOptions: {
    marginTop: 16,
  },
  filterOption: {
    marginBottom: 8,
  },
});

export default RideListingScreen; 