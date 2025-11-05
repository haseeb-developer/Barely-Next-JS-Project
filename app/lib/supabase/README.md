# Supabase Setup

Your Supabase project is now connected! Here's how to use it:

## Client Components (Browser)

```tsx
"use client";
import { useSupabase } from "./lib/supabase/provider";

export function MyComponent() {
  const { supabase } = useSupabase();
  
  // Example: Fetch data
  const fetchData = async () => {
    const { data, error } = await supabase
      .from('your_table')
      .select('*');
    
    if (error) console.error(error);
    return data;
  };
  
  return <div>Your component</div>;
}
```

## Server Components

```tsx
import { createClient } from "./lib/supabase/server";

export default async function ServerComponent() {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('your_table')
    .select('*');
  
  return <div>{/* Your server component */}</div>;
}
```

## Server Actions / API Routes (Service Role - Bypasses RLS)

⚠️ **WARNING**: Only use this in server-side code that needs to bypass Row Level Security.

```tsx
import { createServiceClient } from "./lib/supabase/service";

export async function serverAction() {
  const supabase = createServiceClient();
  
  // This bypasses RLS - use with caution!
  const { data, error } = await supabase
    .from('your_table')
    .select('*');
}
```

## Direct Client Usage (Without Context)

```tsx
"use client";
import { createClient } from "./lib/supabase/client";

const supabase = createClient();

// Use supabase directly
```

