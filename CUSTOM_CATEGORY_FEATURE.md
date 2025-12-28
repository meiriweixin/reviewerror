# Custom Category Feature

**Date:** 2025-12-28
**Enhancement:** Allow users to enter custom category names during upload

## Feature Overview

Users can now create their own custom categories instead of being limited to predefined options. This provides flexibility for organizing questions based on specific topics not covered by the default categories.

## How It Works

### 1. Select "Custom..." Option
- After selecting a subject, the category dropdown includes a "✏️ Custom..." option at the bottom
- Selecting this option reveals a text input field

### 2. Enter Custom Category
- Users type their own category name (e.g., "Linear Equations", "Quadratic Functions", "Stoichiometry")
- Input is limited to 50 characters
- Validation ensures custom category is not empty before upload

### 3. Custom Categories Are Saved
- Custom category is saved to the database exactly as entered
- Category badge will display the custom category name
- Custom categories can be filtered in Review page (by typing in search or selecting from results)

## User Experience

### Before (Predefined Only)
```
Subject: Mathematics
Category: [Algebra, Geometry, Arithmetic...] ← Limited options
```

### After (With Custom Option)
```
Subject: Mathematics
Category: [Algebra, Geometry, Arithmetic... ✏️ Custom...]

When "Custom..." selected:
┌────────────────────────────────────────────┐
│ Enter custom category                      │
│ [Linear Equations________________]        │
│ Create your own category for better        │
│ organization                               │
└────────────────────────────────────────────┘
```

## Implementation Details

### State Management
```javascript
const [category, setCategory] = useState('');
const [customCategory, setCustomCategory] = useState('');
```

### Logic Flow
1. User selects subject → Category dropdown enables
2. User selects "✏️ Custom..." → Text input appears
3. User types custom category name
4. On submit → Uses `customCategory` value if category is "custom"
5. Backend saves custom category to database

### Validation
- If "Custom..." is selected but text input is empty → Shows error: "Please enter a custom category"
- Custom category is trimmed (whitespace removed) before saving
- Maximum length: 50 characters

## Code Changes

### Upload.js Changes

**Added State:**
```javascript
const [customCategory, setCustomCategory] = useState('');
```

**Updated Submit Logic:**
```javascript
// Use custom category if "custom" is selected
const finalCategory = category === 'custom' ? customCategory.trim() : category;
const result = await uploadImage(selectedFile, subject, grade, finalCategory);
```

**Added Custom Option to Dropdown:**
```javascript
{subject && CATEGORY_OPTIONS[subject] && CATEGORY_OPTIONS[subject].length > 0 && (
  <option value="custom" className="text-gray-900">✏️ Custom...</option>
)}
```

**Added Text Input (conditional rendering):**
```javascript
{category === 'custom' && (
  <div className="mt-3">
    <input
      type="text"
      value={customCategory}
      onChange={(e) => setCustomCategory(e.target.value)}
      placeholder="Enter your custom category..."
      maxLength={50}
    />
  </div>
)}
```

## Use Cases

### Example 1: Mathematics - Specific Topics
**Predefined:** Algebra (too broad)
**Custom:** "Quadratic Equations", "Linear Inequalities", "Polynomial Division"

### Example 2: Physics - Subtopics
**Predefined:** Mechanics (too general)
**Custom:** "Projectile Motion", "Newton's Laws", "Rotational Dynamics"

### Example 3: Chemistry - Detailed Topics
**Predefined:** Organic Chemistry (broad)
**Custom:** "Alkenes Reactions", "Carboxylic Acids", "Isomerism"

### Example 4: Completely New Categories
**Subject:** Computer Science
**Predefined:** (none available)
**Custom:** "Binary Trees", "Graph Algorithms", "Dynamic Programming"

## Testing Instructions

### Test 1: Basic Custom Category
1. Go to Upload page
2. Select Subject: "Mathematics"
3. Select Category: "✏️ Custom..."
4. Text input appears below dropdown
5. Type: "Linear Equations"
6. Upload an image
7. Verify question is created with category "Linear Equations"
8. Check Review page → Badge shows "Linear Equations"

### Test 2: Switching Between Predefined and Custom
1. Select Subject: "Mathematics"
2. Select Category: "Algebra"
3. Change to: "✏️ Custom..."
4. Type: "Quadratic Functions"
5. Change back to: "Geometry"
6. Custom input disappears
7. Custom text is cleared

### Test 3: Validation
1. Select Subject: "Physics"
2. Select Category: "✏️ Custom..."
3. Leave text input empty
4. Try to upload
5. Should show error: "Please enter a custom category"

### Test 4: Filtering Custom Categories
1. Upload question with custom category "Linear Equations"
2. Go to Review page
3. Select Subject: "Mathematics"
4. Questions with "Linear Equations" should appear
5. Category badge shows "Linear Equations"

## Benefits

### 1. Flexibility
- Not limited by predefined categories
- Can organize questions based on specific curriculum topics
- Accommodates different education systems and syllabi

### 2. Personalization
- Students can create categories that match their textbook chapters
- Teachers can use categories from their lesson plans
- Better alignment with personal study methods

### 3. Granularity
- Predefined categories (e.g., "Algebra") are often too broad
- Custom categories allow precise topic tracking (e.g., "Solving Simultaneous Equations")
- Better insights into specific weak areas

### 4. Future-Proof
- New subjects or topics can be added without code changes
- Adapts to curriculum changes
- Works for specialized or advanced topics

## Limitations & Considerations

### 1. No Category Management UI (Yet)
- Custom categories are created during upload only
- No way to edit/delete/rename custom categories
- Future enhancement: Category management page

### 2. Filtering Custom Categories
- Review page dropdown only shows predefined categories
- To filter by custom category: Use search function
- Future enhancement: Show all used categories (predefined + custom) in filter dropdown

### 3. No Autocomplete
- Users must type custom category exactly each time
- No suggestions for previously used custom categories
- Future enhancement: Show recently used custom categories

### 4. Case Sensitivity
- "Linear Equations" ≠ "linear equations" ≠ "Linear equations"
- Users should be consistent with capitalization
- Future enhancement: Auto-capitalize or normalize category names

## Future Enhancements

### 1. Category Management Dashboard
- View all categories (predefined + custom)
- Edit/rename categories across all questions
- Merge duplicate categories
- Delete unused categories

### 2. Smart Autocomplete
```javascript
// Show recently used custom categories
Recently Used:
- Linear Equations (5 questions)
- Quadratic Functions (3 questions)

Predefined:
- Algebra
- Geometry
...
```

### 3. Category Suggestions
```javascript
// AI suggests category based on question content
Suggested: "Projectile Motion"
[Use Suggestion] [Enter Custom]
```

### 4. Bulk Category Update
- Select multiple questions
- Assign/change category for all selected
- Useful for organizing historical questions

### 5. Category Analytics
- Show most used categories
- Identify categories with low understanding
- Recommend focus areas based on category performance

## Best Practices

### For Students
1. **Be Consistent:** Use the same spelling/capitalization for related topics
2. **Be Specific:** "Linear Equations" is better than "Algebra Problems"
3. **Use Predefined First:** Check if a predefined category fits before creating custom
4. **Keep It Short:** 2-4 words is ideal (e.g., "Projectile Motion")

### For Teachers
1. **Match Curriculum:** Use category names that match textbook chapters
2. **Coordinate with Class:** If sharing questions, agree on category naming
3. **Document Categories:** Keep a list of custom categories used
4. **Review Regularly:** Consolidate similar custom categories

## Troubleshooting

### Custom input not appearing
- **Check:** Is a subject selected?
- **Check:** Did you select "✏️ Custom..." from dropdown?
- **Check:** Does the subject have predefined categories? (Custom option only shows if there are predefined options)

### Error: "Please enter a custom category"
- **Cause:** Selected "Custom..." but left text input empty
- **Fix:** Type a category name before uploading

### Custom category not showing in Review filter
- **Expected:** Custom categories won't appear in the dropdown (only predefined categories)
- **Workaround:** Use the search function to find questions by custom category
- **Future:** Will add used categories to filter dropdown

---

**Feature Complete!** Users can now create unlimited custom categories for precise question organization. 🎉
