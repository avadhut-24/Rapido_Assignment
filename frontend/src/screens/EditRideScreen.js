import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  HelperText,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { rideAPI } from '../services/api';
import Toast from 'react-native-toast-message';

const EditRideScreen = ({ navigation, route }) => {
  const { ride, shouldRefresh } = route.params;
  
  const [formData, setFormData] = useState({
    pickupLocation: ride.pickupLocation,
    dropLocation: ride.dropLocation,
    scheduledTime: new Date(ride.scheduledTime),
    purpose: ride.purpose || '',
    notes: ride.notes || '',
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.pickupLocation.trim()) {
      newErrors.pickupLocation = 'Pickup location is required';
    }

    if (!formData.dropLocation.trim()) {
      newErrors.dropLocation = 'Drop location is required';
    }

    if (formData.scheduledTime <= new Date()) {
      newErrors.scheduledTime = 'Scheduled time must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateRide = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await rideAPI.updateRide(ride.id, {
        ...formData,
        scheduledTime: formData.scheduledTime.toISOString(),
      });

      Toast.show({
        type: 'success',
        text1: 'Ride Updated! 🚗',
        text2: 'Your ride has been updated successfully',
      });

             // Navigate back to ride listing
       if (shouldRefresh) {
         // If we came from RideDetail, go back to RideListing to refresh
         navigation.navigate('Rides');
       } else {
         navigation.goBack();
       }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update ride';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      updateFormData('scheduledTime', selectedDate);
    }
  };

  const formatDateTime = (date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Edit Ride</Title>
            <Paragraph style={styles.subtitle}>
              Update your ride details below
            </Paragraph>

            <TextInput
              label="Pickup Location"
              value={formData.pickupLocation}
              onChangeText={(value) => updateFormData('pickupLocation', value)}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="map-marker" />}
            />
            {errors.pickupLocation && (
              <HelperText type="error" visible={!!errors.pickupLocation}>
                {errors.pickupLocation}
              </HelperText>
            )}

            <TextInput
              label="Drop Location"
              value={formData.dropLocation}
              onChangeText={(value) => updateFormData('dropLocation', value)}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="map-marker-check" />}
            />
            {errors.dropLocation && (
              <HelperText type="error" visible={!!errors.dropLocation}>
                {errors.dropLocation}
              </HelperText>
            )}

            <Button
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              style={styles.dateButton}
              left={<MaterialIcons name="schedule" size={20} />}
            >
              {formatDateTime(formData.scheduledTime)}
            </Button>
            {errors.scheduledTime && (
              <HelperText type="error" visible={!!errors.scheduledTime}>
                {errors.scheduledTime}
              </HelperText>
            )}

            {showDatePicker && (
              <DateTimePicker
                value={formData.scheduledTime}
                mode="datetime"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}

            <TextInput
              label="Purpose (Optional)"
              value={formData.purpose}
              onChangeText={(value) => updateFormData('purpose', value)}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="business" />}
              placeholder="e.g., Business meeting, Airport pickup"
            />

            <TextInput
              label="Notes (Optional)"
              value={formData.notes}
              onChangeText={(value) => updateFormData('notes', value)}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="note" />}
              multiline
              numberOfLines={3}
              placeholder="Any additional notes or special requirements"
            />

            <Button
              mode="contained"
              onPress={handleUpdateRide}
              style={styles.updateButton}
              loading={loading}
              disabled={loading}
            >
              Update Ride
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 16,
  },
  card: {
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  dateButton: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  updateButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
});

export default EditRideScreen; 