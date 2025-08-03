import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  TextInput,
  Avatar,
  List,
  Divider,
  HelperText,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/api';
import Toast from 'react-native-toast-message';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    company: user?.company || '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState({});

  const updateProfileData = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updatePasswordData = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateProfile = () => {
    const newErrors = {};
    if (!profileData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProfile = async () => {
    if (!validateProfile()) {
      return;
    }

    setLoading(true);
    try {
      const response = await userAPI.updateProfile(profileData);
      updateUser(response.data.user);
      setEditing(false);
      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your profile has been updated successfully',
      });
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update profile';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) {
      return;
    }

    setLoading(true);
    try {
      await userAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setShowPasswordDialog(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      Toast.show({
        type: 'success',
        text1: 'Password Changed',
        text2: 'Your password has been changed successfully',
      });
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to change password';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    console.log("handleLogout Triggered");
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    console.log("Logout confirmed");
    setShowLogoutDialog(false);
    logout();
  };

  const cancelLogout = () => {
    console.log("Logout cancelled");
    setShowLogoutDialog(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <Avatar.Text 
            size={80} 
            label={user?.name?.charAt(0)?.toUpperCase() || 'U'} 
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Title style={styles.profileName}>{user?.name}</Title>
            <Paragraph style={styles.profileEmail}>{user?.email}</Paragraph>
            <Paragraph style={styles.profileRole}>
              {user?.role === 'ADMIN' ? 'Administrator' : 'User'}
            </Paragraph>
          </View>
        </Card.Content>
      </Card>

      {/* Profile Details */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={styles.cardTitle}>Profile Information</Title>
            <Button
              mode="text"
              onPress={() => setEditing(!editing)}
              disabled={loading}
            >
              {editing ? 'Cancel' : 'Edit'}
            </Button>
          </View>

          {editing ? (
            <View>
              <TextInput
                label="Full Name"
                value={profileData.name}
                onChangeText={(value) => updateProfileData('name', value)}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="account" />}
              />
              {errors.name && (
                <HelperText type="error" visible={!!errors.name}>
                  {errors.name}
                </HelperText>
              )}

              <TextInput
                label="Phone Number"
                value={profileData.phone}
                onChangeText={(value) => updateProfileData('phone', value)}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="phone" />}
                keyboardType="phone-pad"
              />

              <TextInput
                label="Company"
                value={profileData.company}
                onChangeText={(value) => updateProfileData('company', value)}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="business" />}
              />

              <Button
                mode="contained"
                onPress={handleUpdateProfile}
                style={styles.saveButton}
                loading={loading}
                disabled={loading}
              >
                Save Changes
              </Button>
            </View>
          ) : (
            <View>
              <List.Item
                title="Full Name"
                description={user?.name}
                left={(props) => <List.Icon {...props} icon="account" />}
              />
              <Divider />
              <List.Item
                title="Phone Number"
                description={user?.phone || 'Not provided'}
                left={(props) => <List.Icon {...props} icon="phone" />}
              />
              <Divider />
              <List.Item
                title="Company"
                description={user?.company || 'Not provided'}
                left={(props) => <List.Icon {...props} icon="business" />}
              />
              <Divider />
              <List.Item
                title="Member Since"
                description={formatDate(user?.createdAt)}
                left={(props) => <List.Icon {...props} icon="calendar" />}
              />
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Account Actions */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Account Actions</Title>
          
          <List.Item
            title="Change Password"
            description="Update your account password"
            left={(props) => <List.Icon {...props} icon="lock" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setShowPasswordDialog(true)}
          />
          <Divider />
          <List.Item
            title="Logout"
            description="Sign out of your account"
            left={(props) => <List.Icon {...props} icon="logout" color="#F44336" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleLogout}
            titleStyle={{ color: '#F44336' }}
          />
        </Card.Content>
      </Card>



      {/* Logout Confirmation Dialog */}
      <Modal
        visible={showLogoutDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelLogout}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <Card.Title title="Confirm Logout" />
            <Card.Content>
              <Paragraph style={styles.modalText}>
                Are you sure you want to logout? You will need to sign in again to access your account.
              </Paragraph>
            </Card.Content>
            <Card.Actions>
              <Button onPress={cancelLogout}>Cancel</Button>
              <Button 
                onPress={confirmLogout}
                mode="contained"
                buttonColor="#F44336"
              >
                Logout
              </Button>
            </Card.Actions>
          </Card>
        </View>
      </Modal>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPasswordDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <Card.Title title="Change Password" />
            <Card.Content>
              <TextInput
                label="Current Password"
                value={passwordData.currentPassword}
                onChangeText={(value) => updatePasswordData('currentPassword', value)}
                mode="outlined"
                style={styles.modalInput}
                secureTextEntry
                left={<TextInput.Icon icon="lock" />}
              />
              {errors.currentPassword && (
                <HelperText type="error" visible={!!errors.currentPassword}>
                  {errors.currentPassword}
                </HelperText>
              )}

              <TextInput
                label="New Password"
                value={passwordData.newPassword}
                onChangeText={(value) => updatePasswordData('newPassword', value)}
                mode="outlined"
                style={styles.modalInput}
                secureTextEntry
                left={<TextInput.Icon icon="lock-plus" />}
              />
              {errors.newPassword && (
                <HelperText type="error" visible={!!errors.newPassword}>
                  {errors.newPassword}
                </HelperText>
              )}

              <TextInput
                label="Confirm New Password"
                value={passwordData.confirmPassword}
                onChangeText={(value) => updatePasswordData('confirmPassword', value)}
                mode="outlined"
                style={styles.modalInput}
                secureTextEntry
                left={<TextInput.Icon icon="lock-check" />}
              />
              {errors.confirmPassword && (
                <HelperText type="error" visible={!!errors.confirmPassword}>
                  {errors.confirmPassword}
                </HelperText>
              )}
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => setShowPasswordDialog(false)}>Cancel</Button>
              <Button 
                onPress={handleChangePassword}
                loading={loading}
                disabled={loading}
                mode="contained"
              >
                Change Password
              </Button>
            </Card.Actions>
          </Card>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileCard: {
    margin: 16,
    elevation: 4,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: {
    marginBottom: 16,
    backgroundColor: '#2196F3',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  profileRole: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  card: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 8,
  },
  dialogInput: {
    marginBottom: 16,
  },
  dialogText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginVertical: 8,
  },
  dialogCard: {
    margin: 16,
    marginTop: 8,
    elevation: 8,
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
  modalInput: {
    marginBottom: 16,
  },
});

export default ProfileScreen; 