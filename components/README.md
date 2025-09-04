# ProfileImageViewer Component

A reusable full-screen image viewer component for profile pictures with zoom and dismiss functionality.

## Features

- ✅ **Full-screen display** with dark overlay
- ✅ **Pinch to zoom** (up to 3x magnification)
- ✅ **Tap to dismiss** anywhere on the image
- ✅ **Close button** (✕) in top-right corner
- ✅ **Optional back button** (←) in top-left corner
- ✅ **Smooth animations** with fade transition
- ✅ **Responsive design** that works on all screen sizes

## Usage

### Basic Usage

```tsx
import ProfileImageViewer from "@/components/ProfileImageViewer";

// In your component
const [showImage, setShowImage] = useState(false);
const [imageUrl, setImageUrl] = useState("");

const openImage = (url: string) => {
  setImageUrl(url);
  setShowImage(true);
};

const closeImage = () => {
  setShowImage(false);
  setImageUrl("");
};

// In your JSX
<TouchableOpacity onPress={() => openImage(user.profile_pic)}>
  <Image source={{ uri: user.profile_pic }} style={styles.profilePic} />
</TouchableOpacity>

<ProfileImageViewer
  visible={showImage}
  imageUrl={imageUrl}
  onClose={closeImage}
/>
```

### With Back Button

```tsx
<ProfileImageViewer
  visible={showImage}
  imageUrl={imageUrl}
  onClose={closeImage}
  showBackButton={true}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | `boolean` | - | Controls whether the modal is shown |
| `imageUrl` | `string` | - | URL of the image to display |
| `onClose` | `() => void` | - | Function called when user dismisses the modal |
| `showBackButton` | `boolean` | `false` | Whether to show the back arrow button |

## Implementation Examples

### In Profile Screen
```tsx
// Make profile picture clickable
<TouchableOpacity 
  onPress={() => profileData?.profile_pic && openFullScreenImage(profileData.profile_pic)}
  activeOpacity={0.8}
>
  <Image source={{ uri: profileData.profile_pic }} style={styles.profilePic} />
</TouchableOpacity>
```

### In User Profile Page
```tsx
// For viewing other users' profile pictures
<TouchableOpacity 
  onPress={() => user?.profile_pic && openFullScreenImage(user.profile_pic)}
  activeOpacity={0.8}
>
  <Image source={{ uri: user.profile_pic }} style={styles.profilePic} />
</TouchableOpacity>
```

## Styling

The component uses a dark overlay (`rgba(0,0,0,0.9)`) and centers the image. The close button is positioned in the top-right corner with a semi-transparent background.

## Dependencies

- `react-native`
- `lucide-react-native` (for ArrowLeft icon)

No additional gesture handling libraries required - uses built-in ScrollView zoom functionality.
