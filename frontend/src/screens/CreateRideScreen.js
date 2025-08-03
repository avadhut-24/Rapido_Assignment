import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
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

const CreateRideScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    pickupLocation: '',
    dropLocation: '',
    scheduledTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    purpose: '',
    notes: '',
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

  const handleCreateRide = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await rideAPI.createRide({
        ...formData,
        scheduledTime: formData.scheduledTime.toISOString(),
      });

      Toast.show({
        type: 'success',
        text1: 'Ride Created! 🚗',
        text2: 'Your ride request has been submitted successfully',
      });

      // Navigate back to ride listing
      navigation.goBack();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to create ride';
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
    return date.toLocaleString();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <MaterialIcons name="add-location" size={60} color="#2196F3" />
          <Title style={styles.title}>Create New Ride</Title>
          <Paragraph style={styles.subtitle}>
            Book your ride in just a few steps
          </Paragraph>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Ride Details</Title>

            {/* Pickup Location */}
            <TextInput
              label="Pickup Location"
              value={formData.pickupLocation}
              onChangeText={(value) => updateFormData('pickupLocation', value)}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="location-on" />}
              placeholder="Enter pickup address"
            />
            {errors.pickupLocation && (
              <HelperText type="error" visible={!!errors.pickupLocation}>
                {errors.pickupLocation}
              </HelperText>
            )}

            {/* Drop Location */}
            <TextInput
              label="Drop Location"
              value={formData.dropLocation}
              onChangeText={(value) => updateFormData('dropLocation', value)}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="location-off" />}
              placeholder="Enter destination address"
            />
            {errors.dropLocation && (
              <HelperText type="error" visible={!!errors.dropLocation}>
                {errors.dropLocation}
              </HelperText>
            )}

            {/* Scheduled Time */}
            <TextInput
              label="Scheduled Time"
              value={formatDateTime(formData.scheduledTime)}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="schedule" />}
              right={
                <TextInput.Icon
                  icon="calendar"
                  onPress={() => setShowDatePicker(true)}
                />
              }
              onPressIn={() => setShowDatePicker(true)}
              editable={false}
            />
            {errors.scheduledTime && (
              <HelperText type="error" visible={!!errors.scheduledTime}>
                {errors.scheduledTime}
              </HelperText>
            )}

            {/* Purpose */}
            <TextInput
              label="Purpose (Optional)"
              value={formData.purpose}
              onChangeText={(value) => updateFormData('purpose', value)}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="business" />}
              placeholder="e.g., Business meeting, Airport pickup"
            />

            {/* Notes */}
            <TextInput
              label="Additional Notes (Optional)"
              value={formData.notes}
              onChangeText={(value) => updateFormData('notes', value)}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="note" />}
              placeholder="Any special instructions or requirements"
              multiline
              numberOfLines={3}
            />

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={[styles.button, styles.cancelButton]}
                disabled={loading}
              >
                Cancel
              </Button>
              
              <Button
                mode="contained"
                onPress={handleCreateRide}
                style={styles.button}
                loading={loading}
                disabled={loading}
              >
                Create Ride
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Date/Time Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={formData.scheduledTime}
            mode="datetime"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
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
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  card: {
    elevation: 4,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButton: {
    borderColor: '#666',
  },
});

export default CreateRideScreen; 