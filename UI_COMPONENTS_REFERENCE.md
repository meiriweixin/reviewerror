# UI Components Reference Guide

A comprehensive guide to all the new UI components available in your application.

## 📦 Available Components

All components are located in `src/components/ui/`

---

## Button Component

**File**: `src/components/ui/button.tsx`

A versatile button component with multiple variants and sizes.

### Import
```tsx
import { Button } from '@/components/ui/button'
```

### Basic Usage
```tsx
<Button>Click me</Button>
```

### Variants
```tsx
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
```

### Sizes
```tsx
<Button size="default">Default Size</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">🎯</Button>
```

### As Child (Composition)
Use with React Router Link:
```tsx
import { Link } from 'react-router-dom'

<Button asChild>
  <Link to="/dashboard">Go to Dashboard</Link>
</Button>
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `"default" \| "destructive" \| "outline" \| "secondary" \| "ghost" \| "link"` | `"default"` | Button style variant |
| size | `"default" \| "sm" \| "lg" \| "icon"` | `"default"` | Button size |
| asChild | `boolean` | `false` | Renders as child component |
| className | `string` | - | Additional CSS classes |

### Examples

**Submit Button**
```tsx
<Button 
  type="submit" 
  size="lg"
  className="w-full"
>
  Submit Form
</Button>
```

**Icon Button**
```tsx
import { Trash2 } from 'lucide-react'

<Button variant="destructive" size="icon">
  <Trash2 className="h-4 w-4" />
</Button>
```

**Loading Button**
```tsx
<Button disabled={loading}>
  {loading ? 'Loading...' : 'Submit'}
</Button>
```

---

## AnimatedGroup Component

**File**: `src/components/ui/animated-group.tsx`

Creates stagger animations for child elements.

### Import
```tsx
import { AnimatedGroup } from '@/components/ui/animated-group'
```

### Basic Usage
```tsx
<AnimatedGroup preset="fade">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</AnimatedGroup>
```

### Animation Presets
```tsx
<AnimatedGroup preset="fade">...</AnimatedGroup>
<AnimatedGroup preset="slide">...</AnimatedGroup>
<AnimatedGroup preset="scale">...</AnimatedGroup>
<AnimatedGroup preset="blur">...</AnimatedGroup>
<AnimatedGroup preset="blur-slide">...</AnimatedGroup>
<AnimatedGroup preset="zoom">...</AnimatedGroup>
<AnimatedGroup preset="flip">...</AnimatedGroup>
<AnimatedGroup preset="bounce">...</AnimatedGroup>
<AnimatedGroup preset="rotate">...</AnimatedGroup>
<AnimatedGroup preset="swing">...</AnimatedGroup>
```

### Custom Variants
```tsx
<AnimatedGroup
  variants={{
    container: {
      visible: {
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.2,
        },
      },
    },
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    },
  }}
>
  <div>Custom animated content</div>
</AnimatedGroup>
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | `ReactNode` | - | Elements to animate |
| preset | `PresetType` | - | Animation preset |
| variants | `{ container?: Variants, item?: Variants }` | - | Custom animation variants |
| className | `string` | - | Additional CSS classes |

### Examples

**Feature List Animation**
```tsx
<AnimatedGroup preset="slide">
  <div className="feature-card">AI-powered extraction</div>
  <div className="feature-card">Smart tracking</div>
  <div className="feature-card">Progress analytics</div>
</AnimatedGroup>
```

**Hero Content Animation**
```tsx
<AnimatedGroup preset="blur-slide">
  <h1>Welcome to Our App</h1>
  <p>Your learning companion</p>
  <Button>Get Started</Button>
</AnimatedGroup>
```

---

## InfiniteSlider Component

**File**: `src/components/ui/infinite-slider.tsx`

Creates an infinite scrolling carousel effect.

### Import
```tsx
import { InfiniteSlider } from '@/components/ui/infinite-slider'
```

### Basic Usage
```tsx
<InfiniteSlider speed={40}>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</InfiniteSlider>
```

### With Hover Effect
```tsx
<InfiniteSlider 
  speed={40}
  speedOnHover={20}
  gap={24}
>
  <img src="logo1.png" alt="Logo 1" />
  <img src="logo2.png" alt="Logo 2" />
  <img src="logo3.png" alt="Logo 3" />
</InfiniteSlider>
```

### Vertical Slider
```tsx
<InfiniteSlider 
  direction="vertical"
  speed={30}
>
  <div>Vertical Item 1</div>
  <div>Vertical Item 2</div>
</InfiniteSlider>
```

### Reverse Direction
```tsx
<InfiniteSlider reverse={true} speed={40}>
  <div>Scrolls right to left</div>
</InfiniteSlider>
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | `ReactNode` | - | Content to scroll |
| speed | `number` | `25` | Animation speed (higher = slower) |
| speedOnHover | `number` | - | Speed when hovering |
| gap | `number` | `16` | Gap between items (px) |
| direction | `"horizontal" \| "vertical"` | `"horizontal"` | Scroll direction |
| reverse | `boolean` | `false` | Reverse scroll direction |
| className | `string` | - | Additional CSS classes |

### Examples

**Logo Cloud**
```tsx
<InfiniteSlider 
  speed={40}
  speedOnHover={20}
  gap={80}
>
  <img src="/logos/partner1.svg" className="h-8" />
  <img src="/logos/partner2.svg" className="h-8" />
  <img src="/logos/partner3.svg" className="h-8" />
  <img src="/logos/partner4.svg" className="h-8" />
</InfiniteSlider>
```

**Testimonial Slider**
```tsx
<InfiniteSlider speed={60} gap={32}>
  <TestimonialCard author="John" text="Great app!" />
  <TestimonialCard author="Jane" text="Love it!" />
  <TestimonialCard author="Bob" text="Awesome!" />
</InfiniteSlider>
```

**Ticker Tape**
```tsx
<InfiniteSlider speed={30} gap={40} className="bg-primary text-white py-2">
  <span>🎉 New feature launched!</span>
  <span>📚 1000+ questions uploaded</span>
  <span>⭐ 5-star reviews</span>
</InfiniteSlider>
```

---

## ProgressiveBlur Component

**File**: `src/components/ui/progressive-blur.tsx`

Creates progressive blur effects at edges.

### Import
```tsx
import { ProgressiveBlur } from '@/components/ui/progressive-blur'
```

### Basic Usage
```tsx
<div className="relative">
  <div className="overflow-hidden">
    {/* Your content */}
  </div>
  <ProgressiveBlur 
    direction="left" 
    className="absolute left-0 top-0 h-full w-20"
  />
  <ProgressiveBlur 
    direction="right"
    className="absolute right-0 top-0 h-full w-20"
  />
</div>
```

### Directions
```tsx
<ProgressiveBlur direction="top" />
<ProgressiveBlur direction="right" />
<ProgressiveBlur direction="bottom" />
<ProgressiveBlur direction="left" />
```

### Custom Intensity
```tsx
<ProgressiveBlur 
  direction="bottom"
  blurIntensity={2}      // Higher = more blur
  blurLayers={12}        // More layers = smoother
/>
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| direction | `"top" \| "right" \| "bottom" \| "left"` | `"bottom"` | Blur direction |
| blurIntensity | `number` | `0.25` | Blur strength multiplier |
| blurLayers | `number` | `8` | Number of blur layers |
| className | `string` | - | Additional CSS classes |

### Examples

**Fade Out Gallery**
```tsx
<div className="relative h-64 overflow-hidden">
  <div className="space-y-4">
    {images.map(img => <img key={img} src={img} />)}
  </div>
  <ProgressiveBlur 
    direction="bottom"
    className="absolute bottom-0 left-0 w-full h-32"
    blurIntensity={1}
  />
</div>
```

**Sidebar Edge Fade**
```tsx
<div className="relative">
  <nav className="overflow-y-auto h-screen">
    {/* Navigation items */}
  </nav>
  <ProgressiveBlur 
    direction="top"
    className="absolute top-0 left-0 w-full h-20 pointer-events-none"
  />
</div>
```

---

## HeroSection Component

**File**: `src/components/ui/hero-section-3.tsx`

Complete hero section with navigation, content, and footer.

### Import
```tsx
import { HeroSection } from '@/components/ui/hero-section-3'
```

### Basic Usage
```tsx
<HeroSection onLoginClick={handleLogin} />
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| onLoginClick | `() => void` | - | Callback when login clicked |

### Customization

The component includes several sub-components you can modify:

1. **HeroHeader**: Navigation with scroll effects
2. **Main Content**: Animated hero text and CTA
3. **AppComponent**: Feature showcase card
4. **LogoCloud**: Infinite scrolling logos

### Examples

**Custom Login Handler**
```tsx
const handleLogin = () => {
  // Show login modal
  setShowModal(true)
}

<HeroSection onLoginClick={handleLogin} />
```

**Standalone Components**
You can extract and use individual parts:

```tsx
// Just the logo cloud
import { LogoCloud } from '@/components/ui/hero-section-3'

<LogoCloud />
```

---

## Utility Function

### cn() - Class Name Utility

**File**: `src/lib/utils.ts`

Merges class names intelligently with Tailwind CSS.

### Import
```tsx
import { cn } from '@/lib/utils'
```

### Usage
```tsx
const buttonClass = cn(
  "px-4 py-2 rounded",           // Base classes
  isActive && "bg-blue-500",     // Conditional
  isPrimary ? "text-white" : "text-gray-700",
  className                       // Props override
)

<button className={buttonClass}>Click</button>
```

### Why Use cn()?
- Handles conditional classes
- Resolves Tailwind conflicts (last class wins)
- Type-safe with TypeScript
- Removes undefined/false values

### Examples

**Conditional Styling**
```tsx
<div className={cn(
  "p-4 border",
  error && "border-red-500",
  success && "border-green-500"
)}>
  Content
</div>
```

**Component with className Prop**
```tsx
function Card({ className, children }) {
  return (
    <div className={cn(
      "rounded-lg shadow-md p-6",
      className  // Allow override
    )}>
      {children}
    </div>
  )
}

// Usage
<Card className="bg-blue-100">Content</Card>
```

**Resolving Conflicts**
```tsx
// Without cn: both classes apply, may cause issues
<div className="p-4 p-8">

// With cn: last one wins
<div className={cn("p-4", "p-8")}>  // p-8 wins
```

---

## 🎨 Design Tokens (CSS Variables)

All components use these design tokens defined in `src/index.css`:

### Colors
```css
--background         /* Page background */
--foreground         /* Text color */
--primary            /* Primary brand color */
--primary-foreground /* Text on primary */
--secondary          /* Secondary color */
--muted              /* Muted backgrounds */
--accent             /* Accent color */
--destructive        /* Error/delete actions */
--border             /* Border color */
--input              /* Input borders */
--ring               /* Focus ring color */
```

### Usage in Components
```tsx
// Tailwind classes automatically use these
<div className="bg-primary text-primary-foreground">
  Primary colored box
</div>

<div className="bg-muted text-muted-foreground">
  Muted colored box
</div>
```

### Custom Colors
```tsx
<div className="border-border bg-background">
  Uses design token colors
</div>
```

---

## 🎯 Common Patterns

### Modal with Backdrop
```tsx
{showModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="bg-background rounded-lg p-6 max-w-md w-full">
      {/* Modal content */}
    </div>
  </div>
)}
```

### Card Component
```tsx
<div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
  <h3 className="font-semibold">Card Title</h3>
  <p className="text-muted-foreground">Card description</p>
</div>
```

### Feature Grid
```tsx
<AnimatedGroup preset="scale" className="grid md:grid-cols-3 gap-6">
  <div className="bg-card p-6 rounded-lg border">Feature 1</div>
  <div className="bg-card p-6 rounded-lg border">Feature 2</div>
  <div className="bg-card p-6 rounded-lg border">Feature 3</div>
</AnimatedGroup>
```

### CTA Section
```tsx
<section className="py-20 bg-muted">
  <AnimatedGroup preset="blur-slide" className="max-w-4xl mx-auto text-center">
    <h2 className="text-4xl font-bold">Ready to get started?</h2>
    <p className="mt-4 text-lg text-muted-foreground">
      Join thousands of students already using our app
    </p>
    <Button size="lg" className="mt-8">
      Get Started Free
    </Button>
  </AnimatedGroup>
</section>
```

---

## 📱 Responsive Utilities

### Breakpoint Classes
```tsx
// Mobile first approach
<div className="
  p-4              /* Mobile */
  md:p-6           /* Tablet (768px+) */
  lg:p-8           /* Desktop (1024px+) */
  xl:p-10          /* Large desktop (1280px+) */
">
  Responsive padding
</div>
```

### Hide/Show on Breakpoints
```tsx
<div className="hidden md:block">
  Only visible on tablet and up
</div>

<div className="md:hidden">
  Only visible on mobile
</div>
```

---

## 🚀 Performance Tips

### Lazy Load Animations
```tsx
// Only animate in viewport
<AnimatedGroup preset="fade">
  {/* Content */}
</AnimatedGroup>
```

### Reduce Motion
```tsx
// Respect user preferences
<AnimatedGroup 
  className="motion-reduce:animate-none"
>
  {/* Content */}
</AnimatedGroup>
```

### Optimize Images in Slider
```tsx
<InfiniteSlider>
  <img 
    src="logo.png" 
    alt="Logo"
    loading="lazy"
    width="100"
    height="40"
  />
</InfiniteSlider>
```

---

## 📚 Resources

- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **Framer Motion API**: https://www.framer.com/motion/
- **Radix UI Primitives**: https://www.radix-ui.com/
- **Lucide Icons**: https://lucide.dev/
- **shadcn/ui**: https://ui.shadcn.com/

---

## 💡 Tips

1. **Use `cn()` for all className merging**
2. **Prefer design tokens over hardcoded colors**
3. **Test animations on low-end devices**
4. **Keep animation presets consistent across your app**
5. **Use semantic HTML with components**
6. **Add `aria-labels` to icon buttons**
7. **Test with keyboard navigation**
8. **Support dark mode from the start**

---

**Need more examples?** Check out the `hero-section-3.tsx` file for real-world usage of all these components together!








