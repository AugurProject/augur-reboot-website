# Google Analytics Integration

This site uses Google Analytics 4 (GA4) with full support for Astro View Transitions.

## Setup

### 1. Get Your GA4 Measurement ID

1. Go to [Google Analytics](https://analytics.google.com)
2. Select your property (or create a new one for augur.net)
3. Go to **Admin** → **Data Streams**
4. Select your web data stream
5. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`)

### 2. Configure Environment Variable

Create a `.env.local` file in the project root:

```bash
PUBLIC_GA_ID=G-XXXXXXXXXX
```

Replace `G-XXXXXXXXXX` with your actual Measurement ID.

**Important:** This must start with `PUBLIC_` prefix for Astro to expose it to the client.

### 3. How It Works

The `GoogleAnalytics` component (`src/components/GoogleAnalytics.astro`) handles:

- **Initial Page Load**: GA initializes on first page load with your Measurement ID
- **View Transitions**: Automatically tracks pageviews when users navigate via Astro View Transitions (soft navigation)
- **Tab Visibility**: Falls back to tracking when user returns to the tab (useful for Single Page App patterns)

### 4. Verify It Works

1. Start dev server: `npm run dev`
2. Open [Google Analytics Real-time Report](https://analytics.google.com) in another tab
3. Navigate your site
4. You should see pageviews appear in the real-time report within seconds

## Component Usage

The component is already integrated into `src/layouts/Layout.astro`:

```astro
<GoogleAnalytics gaId={import.meta.env.PUBLIC_GA_ID} />
```

You can also use it in other layouts if needed:

```astro
---
import GoogleAnalytics from '../components/GoogleAnalytics.astro';
---

<head>
  <GoogleAnalytics gaId={import.meta.env.PUBLIC_GA_ID} />
</head>
```

## Events and Custom Tracking

The component automatically fires `page_view` events on navigation. To track custom events:

```astro
<script>
  const trackEvent = (eventName, eventData) => {
    gtag('event', eventName, eventData);
  };

  // Example: Track button click
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('track-me')) {
      gtag('event', 'button_click', {
        'button_label': e.target.textContent
      });
    }
  });
</script>
```

## View Transitions Compatibility

The integration is optimized for Astro View Transitions:

- Uses `astro:page-load` event to track soft navigations
- No need for manual tracking on each page
- Works seamlessly with `<ClientRouter />` from `astro:transitions`

## Troubleshooting

### No data appearing in GA dashboard

1. **Check environment variable**: Verify `PUBLIC_GA_ID` is set correctly
2. **Check GA property**: Make sure you're looking at the right property in Google Analytics
3. **Check browser console**: Look for any JavaScript errors
4. **Wait for data**: Real-time report may take 30-60 seconds to show data after initial page view

### Building for production

The GA ID is automatically injected at build time via the environment variable. No additional configuration needed for GitHub Pages deployment.

## Production Deployment

When deploying to GitHub Pages:

1. Add the environment variable to GitHub Actions secrets
2. Update the workflow to set `PUBLIC_GA_ID` during build

Example workflow setup:
```yaml
env:
  PUBLIC_GA_ID: ${{ secrets.PUBLIC_GA_ID }}
```

## References

- [Google Analytics 4 Documentation](https://support.google.com/analytics/answer/10089681)
- [Astro View Transitions](https://docs.astro.build/en/guides/view-transitions/)
- [Astro Environment Variables](https://docs.astro.build/en/guides/environment-variables/)
