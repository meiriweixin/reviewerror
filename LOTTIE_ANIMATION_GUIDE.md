# Lottie Animation Integration Guide

## What Changed

The progress showcase component in the hero section has been replaced with an animated robot Lottie animation.

### Before ❌
- Static progress card showing "85% Questions Mastered"
- Text-based progress indicators
- Progress bars for "This Month" and "Last Month"

### After ✅
- Animated robot Lottie animation
- Engaging visual element
- Auto-playing loop animation

## Implementation Details

### 1. Package Installed
```bash
npm install lottie-react --legacy-peer-deps
```

**Package**: `lottie-react` - React wrapper for Lottie animations (JSON format)

### 2. Files Modified

#### `src/components/ui/hero-section-3.tsx`
- Added import: `import Lottie from 'lottie-react'`
- Added import: `import robotAnimation from '../../robot.json'`
- Replaced `AppComponent` with Lottie animation

**New AppComponent:**
```tsx
const AppComponent = () => {
    return (
        <div className="relative rounded-[1rem] bg-white/5 p-4 flex items-center justify-center">
            <Lottie 
                animationData={robotAnimation}
                loop={true}
                autoplay={true}
                style={{ 
                    width: '100%', 
                    height: 'auto',
                    maxWidth: '300px'
                }}
            />
        </div>
    )
}
```

#### `src/types/lottie.d.ts` (Created)
TypeScript declaration file for JSON imports:
```ts
declare module '*.json' {
  const value: any;
  export default value;
}
```

#### `tsconfig.json` (Updated)
Added typeRoots to recognize custom type declarations:
```json
"typeRoots": ["./node_modules/@types", "./src/types"]
```

### 3. Animation File
**Location**: `src/robot.json`

This is a Lottie JSON animation file that contains the robot animation data.

**Note**: The file must be inside the `src/` directory because Create React App doesn't allow imports from outside the `src/` folder.

## Lottie Component Props

### Available Props
```tsx
<Lottie 
  animationData={robotAnimation}  // Required: The Lottie JSON data
  loop={true}                      // Optional: Loop animation (default: true)
  autoplay={true}                  // Optional: Auto-play (default: true)
  style={{ ... }}                  // Optional: Custom styles
  className="..."                  // Optional: CSS classes
  onComplete={() => {}}            // Optional: Callback on animation complete
  onLoopComplete={() => {}}        // Optional: Callback on loop complete
  direction={1}                    // Optional: 1 = forward, -1 = reverse
  speed={1}                        // Optional: Animation speed (default: 1)
/>
```

## Customization Options

### Change Animation Size
```tsx
<Lottie 
  animationData={robotAnimation}
  style={{ 
    width: '400px',        // Change width
    height: 'auto',
    maxWidth: '100%'
  }}
/>
```

### Disable Loop (Play Once)
```tsx
<Lottie 
  animationData={robotAnimation}
  loop={false}
  autoplay={true}
/>
```

### Control Animation Speed
```tsx
<Lottie 
  animationData={robotAnimation}
  speed={1.5}  // 1.5x speed (faster)
/>
```

### Play in Reverse
```tsx
<Lottie 
  animationData={robotAnimation}
  direction={-1}  // Play backwards
/>
```

### Add Custom Styling
```tsx
<Lottie 
  animationData={robotAnimation}
  className="my-custom-class"
  style={{ 
    background: 'rgba(0,0,0,0.1)',
    borderRadius: '1rem',
    padding: '2rem'
  }}
/>
```

## Using Different Animations

### Replace with Another Animation

1. **Add your Lottie JSON file** to `src/` folder:
   ```
   src/
   ├── robot.json
   └── your-animation.json  ← Add here
   ```

2. **Update the import** in `hero-section-3.tsx`:
   ```tsx
   import myAnimation from '../../your-animation.json'
   ```

3. **Use in component**:
   ```tsx
   <Lottie animationData={myAnimation} />
   ```

### Where to Find Lottie Animations

1. **LottieFiles** - https://lottiefiles.com/
   - Largest collection of free and premium Lottie animations
   - Search for "robot", "learning", "education", etc.
   - Download as `.json` format

2. **Create Your Own**
   - Use Adobe After Effects with Bodymovin plugin
   - Use web tools like LottieFiles Creator
   - Export as JSON

## Advanced: Control Animation Programmatically

### Using Ref for Control
```tsx
import { useRef } from 'react'

const MyComponent = () => {
  const lottieRef = useRef<any>(null)
  
  const playAnimation = () => {
    lottieRef.current?.play()
  }
  
  const pauseAnimation = () => {
    lottieRef.current?.pause()
  }
  
  const stopAnimation = () => {
    lottieRef.current?.stop()
  }
  
  return (
    <>
      <Lottie 
        lottieRef={lottieRef}
        animationData={robotAnimation}
        autoplay={false}
      />
      <button onClick={playAnimation}>Play</button>
      <button onClick={pauseAnimation}>Pause</button>
      <button onClick={stopAnimation}>Stop</button>
    </>
  )
}
```

### Play on Hover
```tsx
const [isPaused, setIsPaused] = useState(true)

<div 
  onMouseEnter={() => setIsPaused(false)}
  onMouseLeave={() => setIsPaused(true)}
>
  <Lottie 
    animationData={robotAnimation}
    isPaused={isPaused}
  />
</div>
```

### Play on Scroll (In View)
```tsx
import { useInView } from 'framer-motion'

const ref = useRef(null)
const isInView = useInView(ref, { once: true })

<div ref={ref}>
  <Lottie 
    animationData={robotAnimation}
    autoplay={isInView}
    loop={false}
  />
</div>
```

## Performance Optimization

### Lazy Load Animation
```tsx
import { lazy, Suspense } from 'react'

const Lottie = lazy(() => import('lottie-react'))

<Suspense fallback={<div>Loading...</div>}>
  <Lottie animationData={robotAnimation} />
</Suspense>
```

### Reduce Animation Quality (For Performance)
When creating/exporting Lottie animations:
- Reduce number of keyframes
- Simplify paths and shapes
- Remove unnecessary layers
- Use smaller resolution assets

### Preload Animation Data
```tsx
// In App.js or index.js
import robotAnimation from './robot.json'

// Animation is now preloaded and cached
```

## Troubleshooting

### Animation Not Playing
**Check:**
- ✅ File path is correct: `../../robot.json` (from `src/components/ui/`)
- ✅ JSON file is valid Lottie format
- ✅ JSON file is inside `src/` directory
- ✅ `autoplay={true}` is set
- ✅ No console errors

### Animation Too Large/Small
**Fix:**
```tsx
<Lottie 
  style={{ 
    width: '300px',      // Set explicit size
    height: '300px'
  }}
/>
```

### Animation Lags/Stutters
**Solutions:**
- Reduce animation complexity
- Lower frame rate in source animation
- Use CSS `will-change: transform` for GPU acceleration
- Ensure loop is necessary (or disable it)

### TypeScript Errors on Import
**Ensure:**
- ✅ `src/types/lottie.d.ts` exists
- ✅ `tsconfig.json` includes `"typeRoots"`
- ✅ Restart TypeScript server (VS Code: Ctrl+Shift+P → "Restart TS Server")

## Testing Checklist

After making changes:
- [ ] Animation loads and displays correctly
- [ ] Animation loops smoothly
- [ ] No console errors
- [ ] Responsive on mobile devices
- [ ] Animation doesn't impact page performance
- [ ] Works in different browsers (Chrome, Firefox, Safari)

## Resources

### Lottie Documentation
- **lottie-react**: https://www.npmjs.com/package/lottie-react
- **Lottie Web**: https://airbnb.io/lottie/
- **LottieFiles**: https://lottiefiles.com/

### Tutorials
- Creating Lottie animations: https://lottiefiles.com/blog/working-with-lottie/
- After Effects + Bodymovin: https://helpx.adobe.com/after-effects/using/bodymovin.html

### Free Animation Collections
- https://lottiefiles.com/featured
- https://lottiefiles.com/search?q=education
- https://lottiefiles.com/search?q=robot

## Summary

✅ **Installed**: `lottie-react` package  
✅ **Replaced**: Progress component with robot animation  
✅ **Created**: TypeScript declaration for JSON imports  
✅ **Location**: `src/robot.json`  
✅ **Status**: Animation auto-plays and loops  

**Next Steps:**
1. Restart dev server: `npm start`
2. Visit `http://localhost:3000`
3. Click "Get Started" to see the robot animation in the hero section!

---

**Want to customize?** Edit the `AppComponent` in `src/components/ui/hero-section-3.tsx`

