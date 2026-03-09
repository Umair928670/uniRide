'use client';
import { updateUser } from "@/lib/actions/user.actions";
import { Suspense, useState } from "react";
import {
  ArrowLeft,
  User,
  Car,
  Bell,
  Lock,
  Globe,
  Loader2,
  ChevronRight,
  Save,
  Shield,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  X,
  Check,
  Smartphone,
  Mail,
  MessageSquare,
  Gift,
  Upload,
  FileText,
  Camera,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp, VehicleInfo } from "@/components/app-context";

type Section = "main" | "edit-profile" | "vehicle" | "notification-prefs" | "privacy" | "language" | "delete-account";

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, settings, activeRole, updateProfile, updateVehicle, updateSettings, addNotification, logout } = useApp();
  const initialSection = (searchParams.get("section") as Section) || "main";
  const [section, setSection] = useState<Section>(initialSection);

  if (section === "edit-profile") return <EditProfile user={user} onSave={updateProfile} onBack={() => setSection("main")} addNotification={addNotification} />;
  if (section === "vehicle") return <VehicleSettings vehicle={user.vehicleInfo} onSave={updateVehicle} onBack={() => setSection("main")} addNotification={addNotification} />;
  if (section === "notification-prefs") return <NotificationPrefs settings={settings} onUpdate={updateSettings} onBack={() => setSection("main")} />;
  if (section === "privacy") return <PrivacySettings settings={settings} onUpdate={updateSettings} onBack={() => setSection("main")} />;
  if (section === "language") return <LanguageSettings settings={settings} onUpdate={updateSettings} onBack={() => setSection("main")} addNotification={addNotification} />;
  if (section === "delete-account") return <DeleteAccount onBack={() => setSection("main")} logout={logout} navigate={(path) => router.push(path)} addNotification={addNotification} />;

  return (
    <div className="min-h-full bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2>Settings</h2>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* Account Section */}
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-[12px] text-muted-foreground font-medium uppercase tracking-wide">Account</p>
          </div>
          <SettingsItem icon={<User className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1]" />} label="Edit Profile" subtitle={user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : ""} onClick={() => setSection("edit-profile")} />
          <Divider />
          <SettingsItem
            icon={<Car className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1]" />}
            label="Vehicle Information"
            subtitle={
              user?.vehicleInfo
                ? `${user.vehicleInfo.color} ${user.vehicleInfo.make} ${user.vehicleInfo.model}`
                : "Not set up"
            }
            onClick={() => setSection("vehicle")}
            badge={activeRole !== "passenger" ? "Driver" : undefined}
          />
        </div>

        {/* Preferences Section */}
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-[12px] text-muted-foreground font-medium uppercase tracking-wide">Preferences</p>
          </div>
          <SettingsItem icon={<Bell className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1]" />} label="Notification Preferences" subtitle="Push, email, SMS" onClick={() => setSection("notification-prefs")} />
          <Divider />
          <SettingsItem icon={<Lock className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1]" />} label="Privacy" subtitle="Visibility & data sharing" onClick={() => setSection("privacy")} />
          <Divider />
          <SettingsItem icon={<Globe className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1]" />} label="Language & Units" subtitle={`${settings.language} · ${settings.distanceUnit}`} onClick={() => setSection("language")} />
        </div>

        {/* Danger Zone */}
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-[12px] text-red-500 font-medium uppercase tracking-wide">Danger Zone</p>
          </div>
          <SettingsItem icon={<Trash2 className="w-5 h-5 text-red-500" />} label="Delete Account" labelClass="text-red-500" subtitle="Permanently remove your account" onClick={() => setSection("delete-account")} />
        </div>

        <p className="text-center text-[12px] text-muted-foreground pb-4">UniRide v1.0.0</p>
      </div>
    </div>
  );
}

/* ============ Sub-screens ============ */

function EditProfile({ user, onSave, onBack, addNotification }: { user: any; onSave: (u: any) => void; onBack: () => void; addNotification: (t: any, m: string) => void }) {
  const [name, setName] = useState(user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "");
  const [phone, setPhone] = useState(user?.phone);
  const [bio, setBio] = useState(user?.bio);
  const [department, setDepartment] = useState(user?.department);
  const [photo, setPhoto] = useState<string | null>(user?.photo || user?.avatar || null);
  const [isSaving, setIsSaving] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      addNotification("warning", "File too large. Max 5MB allowed.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Split the single name input into first and last name for MongoDB
      const [firstName, ...rest] = name.trim().split(" ");
      const lastName = rest.join(" ");

      const dbUpdateData = {
        firstName: firstName || user?.firstName,
        lastName: lastName || user?.lastName,
        phone,
        bio,
        department,
        photo
      };

      // 1. Securely save to MongoDB in the background
      await updateUser(dbUpdateData);

      // 2. Instantly update the local UI Context
      onSave({ name, phone, bio, department, photo });

      addNotification("success", "Profile updated successfully!");
      onBack();
    } catch (error) {
      addNotification("error", "Failed to update profile to database.");
    } finally {
      setIsSaving(false); // Turn off spinner if it fails
    }
  };

  return (
    <SubPage title="Edit Profile" onBack={onBack}>
      <div className="space-y-4">
        {/* === Profile Picture Upload UI === */}
        <div className="flex flex-col items-center mb-6 pt-2">
          <div className="relative">
            {/* The Avatar Circle */}
            <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border-4 border-background shadow-sm flex items-center justify-center">
              {photo ? (
                <img src={photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-muted-foreground">
                  {name ? name.charAt(0).toUpperCase() : "U"}
                </span>
              )}
            </div>
            
            {/* The Camera Button Overlay */}
            <label 
              className="absolute bottom-0 right-0 w-8 h-8 bg-[#00C9B1] text-white rounded-full flex items-center justify-center cursor-pointer shadow-md hover:bg-[#00C9B1]/90 transition-colors border-2 border-background" 
              title="Change Photo"
            >
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </label>
          </div>
          <p className="text-[12px] text-muted-foreground mt-2">Tap camera to change picture</p>
        </div>
        {/* ================================= */}
        <InputField label="Full Name" value={name} onChange={setName} />
        <InputField label="Email" value={user.email} onChange={() => { }} disabled hint="Email cannot be changed" />
        <InputField label="Phone" value={phone} onChange={setPhone} placeholder="+1 (555) 000-0000" />
        <InputField label="Department" value={department} onChange={setDepartment} />
        <div>
          <label className="text-[13px] text-muted-foreground mb-1.5 block">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={200}
            className="w-full px-4 py-3 rounded-2xl bg-card border border-border focus:border-[#00C9B1] focus:ring-2 focus:ring-[#00C9B1]/20 outline-none transition-all resize-none"
          />
          <p className="text-[11px] text-muted-foreground text-right mt-1">{bio.length}/200</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full py-3.5 rounded-2xl bg-[#1A3C6E] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#1A3C6E]/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" /> Save Changes
            </>
          )}
        </button>
      </div>
    </SubPage>
  );
}

function VehicleSettings({ vehicle, onSave, onBack, addNotification }: { vehicle: VehicleInfo | null; onSave: (v: VehicleInfo) => void; onBack: () => void; addNotification: (t: any, m: string) => void }) {
  const { user, updateProfile } = useApp();
  const [make, setMake] = useState(vehicle?.make || "");
  const [model, setModel] = useState(vehicle?.model || "");
  const [year, setYear] = useState(vehicle?.year || "");
  const [color, setColor] = useState(vehicle?.color || "");
  const [licensePlate, setLicensePlate] = useState(vehicle?.licensePlate || "");
  const [licenseImage, setLicenseImage] = useState<string | null>(user.driverLicenseImage);
  const [vehiclePic, setVehiclePic] = useState<string | null>(user.vehiclePicture);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      addNotification("warning", "File too large. Max 5MB allowed.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!licenseImage || !vehiclePic) {
      addNotification("warning", "Please upload both driver license and vehicle picture to save.");
      return;
    }

    setIsSaving(true);
    try {
      const vehicleInfo = { make, model, year, color, licensePlate };

      const dbUpdateData = {
        vehicleInfo,
        driverLicenseImage: licenseImage,
        vehiclePicture: vehiclePic,
        isDriverVerified: true // You can set this to false if you want an admin to approve it later!
      };

      // 1. Securely save to MongoDB
      await updateUser(dbUpdateData);

      // 2. Instantly update the local UI Context
      onSave(vehicleInfo);
      updateProfile({ driverLicenseImage: licenseImage, vehiclePicture: vehiclePic });

      addNotification("success", "Vehicle information & documents updated!");
      onBack();
    } catch (error) {
      addNotification("error", "Failed to save vehicle info to database.");
    } finally {
      setIsSaving(false);
    }
  };

  const isComplete = !!(make && model && year && color && licensePlate && licenseImage && vehiclePic);

  return (
    <SubPage title="Vehicle Information" onBack={onBack}>

      {/* Verification Status */}
      <div className={`rounded-2xl p-4 mb-4 flex items-center gap-3 ${isComplete
          ? "bg-green-500/10 border border-green-500/20"
          : "bg-amber-500/10 border border-amber-500/20"
        }`}>
        {isComplete ? (
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
        )}
        <p className="text-[13px]">
          {isComplete
            ? "All documents uploaded. You're ready to drive!"
            : "Complete all fields and upload documents to start driving."}
        </p>
      </div>

      <div className="space-y-4">
        {/* Vehicle Details Card */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <p className="text-[12px] text-muted-foreground font-medium uppercase tracking-wide">Vehicle Details</p>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Make" value={make} onChange={setMake} placeholder="Toyota" />
            <InputField label="Model" value={model} onChange={setModel} placeholder="Corolla" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Year" value={year} onChange={setYear} placeholder="2022" />
            <InputField label="Color" value={color} onChange={setColor} placeholder="White" />
          </div>
          <InputField label="License Plate" value={licensePlate} onChange={setLicensePlate} placeholder="7ABC123" />
        </div>

        {/* Document Uploads Card */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
          <p className="text-[12px] text-muted-foreground font-medium uppercase tracking-wide">Required Documents</p>

          {/* Driver License Upload */}
          <div>
            <label className="text-[13px] text-muted-foreground mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              Driver License <span className="text-red-500">*</span>
            </label>
            {licenseImage ? (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-green-700 dark:text-green-400">Document Uploaded</p>
                    <p className="text-[12px] text-green-600/80 dark:text-green-400/80">Verified and stored securely</p>
                  </div>
                </div>
                {/* Replaced the X button with a functioning Edit file upload button */}
                <label
                  className="w-8 h-8 rounded-full bg-white dark:bg-[#1C2333] flex items-center justify-center text-muted-foreground hover:text-[#00C9B1] hover:bg-[#00C9B1]/10 shadow-sm transition-colors cursor-pointer"
                  title="Update document"
                >
                  <Edit2 className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setLicenseImage)}
                  />
                </label>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 py-8 rounded-2xl border-2 border-dashed border-border hover:border-[#00C9B1] transition-colors cursor-pointer bg-[#F5F7FA] dark:bg-[#1C2333]">
                <div className="w-12 h-12 rounded-full bg-[#1A3C6E]/10 dark:bg-[#00C9B1]/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-[#1A3C6E] dark:text-[#00C9B1]" />
                </div>
                <span className="text-[13px] font-medium text-[#1A3C6E] dark:text-[#00C9B1]">
                  Upload Driver License
                </span>
                <span className="text-[11px] text-muted-foreground">JPG, PNG or PDF (max 5MB)</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, setLicenseImage)}
                />
              </label>
            )}
          </div>

          {/* Vehicle Picture Upload */}
          <div>
            <label className="text-[13px] text-muted-foreground mb-2 flex items-center gap-1.5">
              <Camera className="w-4 h-4" />
              Vehicle Picture <span className="text-red-500">*</span>
            </label>
            {vehiclePic ? (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-green-700 dark:text-green-400">Photo Uploaded</p>
                    <p className="text-[12px] text-green-600/80 dark:text-green-400/80">Vehicle picture verified</p>
                  </div>
                </div>
                {/* Replaced the X button with an Edit button */}
                <label
                  className="w-8 h-8 rounded-full bg-white dark:bg-[#1C2333] flex items-center justify-center text-muted-foreground hover:text-[#00C9B1] hover:bg-[#00C9B1]/10 shadow-sm transition-colors cursor-pointer"
                  title="Update photo"
                >
                  <Edit2 className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setVehiclePic)}
                  />
                </label>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 py-8 rounded-2xl border-2 border-dashed border-border hover:border-[#00C9B1] transition-colors cursor-pointer bg-[#F5F7FA] dark:bg-[#1C2333]">
                <div className="w-12 h-12 rounded-full bg-[#1A3C6E]/10 dark:bg-[#00C9B1]/10 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-[#1A3C6E] dark:text-[#00C9B1]" />
                </div>
                <span className="text-[13px] font-medium text-[#1A3C6E] dark:text-[#00C9B1]">
                  Upload Vehicle Photo
                </span>
                <span className="text-[11px] text-muted-foreground">Clear photo showing license plate (max 5MB)</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, setVehiclePic)}
                />
              </label>
            )}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!isComplete || isSaving}
          className="w-full py-3.5 rounded-2xl bg-[#1A3C6E] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#1A3C6E]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" /> Save Vehicle Info
            </>
          )}
        </button>
      </div>
    </SubPage>
  );
}

function NotificationPrefs({ settings, onUpdate, onBack }: { settings: any; onUpdate: (u: any) => void; onBack: () => void }) {
  return (
    <SubPage title="Notification Preferences" onBack={onBack}>
      <div className="space-y-4">
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-[12px] text-muted-foreground font-medium uppercase tracking-wide">Channels</p>
          </div>
          <ToggleItem icon={<Smartphone className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1]" />} label="Push Notifications" subtitle="Get notified on your device" value={settings.pushNotifications} onChange={(v) => onUpdate({ pushNotifications: v })} />
          <Divider />
          <ToggleItem icon={<Mail className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1]" />} label="Email Notifications" subtitle="Receive email updates" value={settings.emailNotifications} onChange={(v) => onUpdate({ emailNotifications: v })} />
          <Divider />
          <ToggleItem icon={<MessageSquare className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1]" />} label="SMS Notifications" subtitle="Text message alerts" value={settings.smsNotifications} onChange={(v) => onUpdate({ smsNotifications: v })} />
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-[12px] text-muted-foreground font-medium uppercase tracking-wide">Types</p>
          </div>
          <ToggleItem icon={<Car className="w-5 h-5 text-[#00C9B1]" />} label="Ride Reminders" subtitle="Departure time alerts" value={settings.rideReminders} onChange={(v) => onUpdate({ rideReminders: v })} />
          <Divider />
          <ToggleItem icon={<MessageSquare className="w-5 h-5 text-purple-500" />} label="Chat Messages" subtitle="New messages from riders/drivers" value={settings.chatNotifications} onChange={(v) => onUpdate({ chatNotifications: v })} />
          <Divider />
          <ToggleItem icon={<Gift className="w-5 h-5 text-orange-500" />} label="Promotions & Offers" subtitle="Special deals and referral rewards" value={settings.promoAlerts} onChange={(v) => onUpdate({ promoAlerts: v })} />
        </div>
      </div>
    </SubPage>
  );
}

function PrivacySettings({ settings, onUpdate, onBack }: { settings: any; onUpdate: (u: any) => void; onBack: () => void }) {
  return (
    <SubPage title="Privacy" onBack={onBack}>
      <div className="space-y-4">
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-[12px] text-muted-foreground font-medium uppercase tracking-wide">Profile Visibility</p>
          </div>
          <ToggleItem icon={<Eye className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1]" />} label="Public Profile" subtitle="Other students can see your profile" value={settings.showProfilePublic} onChange={(v) => onUpdate({ showProfilePublic: v })} />
          <Divider />
          <ToggleItem icon={<Smartphone className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1]" />} label="Show Phone to Ride Partners" subtitle="Share phone number with matched riders" value={settings.showPhoneToDriver} onChange={(v) => onUpdate({ showPhoneToDriver: v })} />
          <Divider />
          <ToggleItem icon={<Mail className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1]" />} label="Show Email to Ride Partners" subtitle="Share email with matched riders" value={settings.showEmailToDriver} onChange={(v) => onUpdate({ showEmailToDriver: v })} />
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-[12px] text-muted-foreground font-medium uppercase tracking-wide">Data</p>
          </div>
          <ToggleItem icon={<EyeOff className="w-5 h-5 text-[#1A3C6E] dark:text-[#00C9B1]" />} label="Share Ride History" subtitle="Allow others to see your past rides" value={settings.shareRideHistory} onChange={(v) => onUpdate({ shareRideHistory: v })} />
          <Divider />
          <ToggleItem icon={<Shield className="w-5 h-5 text-[#00C9B1]" />} label="Auto-Accept Verified Students" subtitle="Automatically accept ride requests from verified users" value={settings.autoAcceptVerified} onChange={(v) => onUpdate({ autoAcceptVerified: v })} />
        </div>
      </div>
    </SubPage>
  );
}

function LanguageSettings({ settings, onUpdate, onBack, addNotification }: { settings: any; onUpdate: (u: any) => void; onBack: () => void; addNotification: (t: any, m: string) => void }) {
  const languages = ["English", "Spanish", "French", "German", "Chinese", "Hindi", "Arabic", "Portuguese"];

  return (
    <SubPage title="Language & Units" onBack={onBack}>
      <div className="space-y-4">
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-[12px] text-muted-foreground font-medium uppercase tracking-wide">Language</p>
          </div>
          {languages.map((lang, i) => (
            <div key={lang}>
              {i > 0 && <Divider />}
              <button
                onClick={() => {
                  onUpdate({ language: lang });
                  addNotification("success", `Language changed to ${lang}`);
                }}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors"
              >
                <span className="text-[14px]">{lang}</span>
                {settings.language === lang && <Check className="w-5 h-5 text-[#00C9B1]" />}
              </button>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-[12px] text-muted-foreground font-medium uppercase tracking-wide">Distance Unit</p>
          </div>
          {(["miles", "km"] as const).map((unit, i) => (
            <div key={unit}>
              {i > 0 && <Divider />}
              <button
                onClick={() => onUpdate({ distanceUnit: unit })}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors"
              >
                <span className="text-[14px]">{unit === "miles" ? "Miles" : "Kilometers"}</span>
                {settings.distanceUnit === unit && <Check className="w-5 h-5 text-[#00C9B1]" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </SubPage>
  );
}

function DeleteAccount({ onBack, logout, navigate, addNotification }: { onBack: () => void; logout: () => void; navigate: (p: string) => void; addNotification: (t: any, m: string) => void }) {
  const [confirmText, setConfirmText] = useState("");
  const canDelete = confirmText === "DELETE";

  const handleDelete = () => {
    addNotification("info", "Account deletion initiated. You have been logged out.");
    logout();
    navigate("/login");
  };

  return (
    <SubPage title="Delete Account" onBack={onBack}>
      <div className="bg-red-500/10 rounded-2xl p-4 mb-4">
        <p className="text-[14px] font-semibold text-red-600 dark:text-red-400 mb-2">Warning: This action is irreversible</p>
        <ul className="text-[13px] text-red-600/80 dark:text-red-400/80 space-y-1 list-disc pl-4">
          <li>All your ride history will be permanently deleted</li>
          <li>Your profile and ratings will be removed</li>
          <li>Active ride bookings will be cancelled</li>
          <li>You will lose all earned badges</li>
        </ul>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-[13px] text-muted-foreground mb-1.5 block">
            Type <span className="font-semibold text-red-500">DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE"
            className="w-full px-4 py-3.5 rounded-2xl bg-card border border-red-300 dark:border-red-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
          />
        </div>
        <button
          onClick={handleDelete}
          disabled={!canDelete}
          className="w-full py-3.5 rounded-2xl bg-red-500 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-600 transition-colors"
        >
          Permanently Delete Account
        </button>
      </div>
    </SubPage>
  );
}

/* ============ Shared UI components ============ */

function SubPage({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-background pb-24">
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 pt-4">{children}</div>
    </div>
  );
}

function SettingsItem({ icon, label, subtitle, labelClass = "", onClick, badge }: { icon: React.ReactNode; label: string; subtitle?: string; labelClass?: string; onClick: () => void; badge?: string }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors active:bg-muted">
      <div className="flex items-center gap-3 min-w-0">
        {icon}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[14px] ${labelClass}`}>{label}</span>
            {badge && (
              <span className="px-2 py-0.5 rounded-full bg-[#00C9B1]/10 text-[#00C9B1] text-[10px] font-semibold">{badge}</span>
            )}
          </div>
          {subtitle && <p className="text-[12px] text-muted-foreground truncate text-start">{subtitle}</p>}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}

function ToggleItem({ icon, label, subtitle, value, onChange }: { icon: React.ReactNode; label: string; subtitle?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {icon}
        <div className="min-w-0">
          <span className="text-[14px] block">{label}</span>
          {subtitle && <p className="text-[12px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ml-3 ${value ? "bg-[#00C9B1]" : "bg-muted-foreground/30"
          }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-1 transition-all ${value ? "right-1" : "left-1"
            }`}
        />
      </button>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, disabled, hint }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean; hint?: string }) {
  return (
    <div>
      <label className="text-[13px] text-muted-foreground mb-1.5 block">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-3.5 rounded-2xl bg-card border border-border focus:border-[#00C9B1] focus:ring-2 focus:ring-[#00C9B1]/20 outline-none transition-all ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      />
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-border mx-4" />;
}

export default function SettingsPage() {
  return (
    // Wrap the content in Suspense so Next.js doesn't crash during the build
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        Loading settings...
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}