import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Modal,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  TextInput,
  HelperText,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { adminAPI } from '../services/api';
import Toast from 'react-native-toast-message';

const AdminPendingRidesScreen = ({ navigation }) => {
  const [pendingRides, setPendingRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [action, setAction] = useState('');
  const [reason, setReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Load pending rides on component mount
  useEffect(() => {
    loadPendingRides();
    // Set up real-time updates (polling every 30 seconds)
    const interval = setInterval(loadPendingRides, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load pending rides from API
  const loadPendingRides = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllRides({ status: 'PENDING' });
      setPendingRides(response.data.rides);
    } catch (error) {
      console.error('Error loading pending rides:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load pending rides',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPendingRides();
  }, []);

  // Filter rides based on search
  const filteredRides = pendingRides.filter(ride => {
    const matchesSearch = 
      ride.pickupLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.dropLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.purpose?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.user?.company?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Handle ride action (approve/reject)
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
        text1: `Ride ${action === 'APPROVE' ? 'Approved' : 'Rejected'}!`,
        text2: `The ride has been ${action.toLowerCase()}d successfully`,
      });

      // Remove the ride from the list since it's no longer pending
      setPendingRides(prev => prev.filter(ride => ride.id !== selectedRide.id));
      
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
            textStyle={{ color: '#FF9800' }}
            style={[styles.statusChip, { borderColor: '#FF9800' }]}
          >
            PENDING
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
            <MaterialIcons name="business" size={16} color="#666" />
            <Paragraph style={styles.userText}>{item.purpose}</Paragraph>
          </View>
        )}

        {item.notes && (
          <View style={styles.userInfo}>
            <MaterialIcons name="note" size={16} color="#666" />
            <Paragraph style={styles.userText}>{item.notes}</Paragraph>
          </View>
        )}

        <View style={styles.rideActions}>
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
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Pending Approvals</Title>
        <Text style={styles.headerSubtitle}>
          Review and approve/reject ride requests
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search rides, users, or companies..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          mode="outlined"
          left={<TextInput.Icon icon="magnify" />}
        />
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
            <MaterialIcons name="check-circle" size={64} color="#4CAF50" />
            <Text style={styles.emptyText}>No pending rides</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery 
                ? 'No rides match your search criteria'
                : 'All ride requests have been processed!'
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
              title={`${action === 'APPROVE' ? 'Approve' : 'Reject'} Ride`}
              titleStyle={{ color: action === 'APPROVE' ? '#4CAF50' : '#F44336' }}
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
                buttonColor={action === 'APPROVE' ? '#4CAF50' : '#F44336'}
                loading={processingAction}
                disabled={processingAction}
              >
                {action === 'APPROVE' ? 'Approve' : 'Reject'}
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    backgroundColor: '#fff',
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
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  approveButton: {
    marginRight: 4,
  },
  rejectButton: {
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

export default AdminPendingRidesScreen; 