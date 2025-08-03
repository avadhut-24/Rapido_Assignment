import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  Button,
  Divider,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { rideAPI } from '../services/api';
import Toast from 'react-native-toast-message';

const RideDetailScreen = ({ navigation, route }) => {
  const { ride } = route.params;

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatCreatedDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Handle ride cancellation
  const handleCancelRide = (rideId) => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await rideAPI.cancelRide(rideId);
              Toast.show({
                type: 'success',
                text1: 'Ride Cancelled',
                text2: 'Your ride has been cancelled successfully',
              });
              // Navigate back to ride listing
              navigation.goBack();
            } catch (error) {
              const errorMessage = error.response?.data?.error || 'Failed to cancel ride';
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: errorMessage,
              });
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Ride Status Card */}
      <Card style={styles.statusCard}>
        <Card.Content>
          <View style={styles.statusHeader}>
            <Title style={styles.rideTitle}>
              {ride.pickupLocation} → {ride.dropLocation}
            </Title>
            <Chip
              mode="outlined"
              textStyle={{ color: getStatusColor(ride.status) }}
              style={[styles.statusChip, { borderColor: getStatusColor(ride.status) }]}
            >
              {ride.status}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Ride Details Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Ride Details</Title>
          
          <View style={styles.detailRow}>
            <MaterialIcons name="schedule" size={20} color="#666" />
            <View style={styles.detailContent}>
              <Paragraph style={styles.detailLabel}>Scheduled Time</Paragraph>
              <Paragraph style={styles.detailValue}>
                {formatDate(ride.scheduledTime)}
              </Paragraph>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.detailRow}>
            <MaterialIcons name="map-marker" size={20} color="#666" />
            <View style={styles.detailContent}>
              <Paragraph style={styles.detailLabel}>Pickup Location</Paragraph>
              <Paragraph style={styles.detailValue}>{ride.pickupLocation}</Paragraph>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.detailRow}>
            <MaterialIcons name="map-marker-check" size={20} color="#666" />
            <View style={styles.detailContent}>
              <Paragraph style={styles.detailLabel}>Drop Location</Paragraph>
              <Paragraph style={styles.detailValue}>{ride.dropLocation}</Paragraph>
            </View>
          </View>

          {ride.purpose && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.detailRow}>
                <MaterialIcons name="business" size={20} color="#666" />
                <View style={styles.detailContent}>
                  <Paragraph style={styles.detailLabel}>Purpose</Paragraph>
                  <Paragraph style={styles.detailValue}>{ride.purpose}</Paragraph>
                </View>
              </View>
            </>
          )}

          {ride.notes && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.detailRow}>
                <MaterialIcons name="note" size={20} color="#666" />
                <View style={styles.detailContent}>
                  <Paragraph style={styles.detailLabel}>Notes</Paragraph>
                  <Paragraph style={styles.detailValue}>{ride.notes}</Paragraph>
                </View>
              </View>
            </>
          )}

          <Divider style={styles.divider} />

          <View style={styles.detailRow}>
            <MaterialIcons name="person" size={20} color="#666" />
            <View style={styles.detailContent}>
              <Paragraph style={styles.detailLabel}>Requested By</Paragraph>
              <Paragraph style={styles.detailValue}>{ride.user?.name}</Paragraph>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.detailRow}>
            <MaterialIcons name="calendar-today" size={20} color="#666" />
            <View style={styles.detailContent}>
              <Paragraph style={styles.detailLabel}>Created On</Paragraph>
              <Paragraph style={styles.detailValue}>
                {formatCreatedDate(ride.createdAt)}
              </Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
                 {ride.status === 'PENDING' && (
           <Button
             mode="contained"
             onPress={() => {
               // Pass a flag to indicate we should refresh when returning
               navigation.navigate('EditRide', { ride, shouldRefresh: true });
             }}
             style={styles.actionButton}
           >
             Edit Ride
           </Button>
         )}

                 {['PENDING', 'APPROVED'].includes(ride.status) && (
           <Button
             mode="outlined"
             onPress={() => handleCancelRide(ride.id)}
             style={[styles.actionButton, styles.cancelButton]}
             textColor="#F44336"
           >
             Cancel Ride
           </Button>
         )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statusCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  card: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    marginVertical: 8,
  },
  actionContainer: {
    padding: 16,
    paddingTop: 8,
  },
  actionButton: {
    marginBottom: 8,
  },
  cancelButton: {
    borderColor: '#F44336',
  },
});

export default RideDetailScreen; 