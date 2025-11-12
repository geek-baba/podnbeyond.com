const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Template Variable Replacement Engine
 * Replaces template variables like {{guestName}}, {{bookingId}}, etc. with actual values
 */

/**
 * Get booking context for template variables
 */
async function getBookingContext(bookingId) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            slug: true,
            phone: true,
            email: true,
            address: true,
            city: true,
          },
        },
        roomType: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!booking) {
      return null;
    }

    // Format dates
    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    };

    const formatTime = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return {
      // Guest info
      guestName: booking.guestName || 'Guest',
      guestEmail: booking.email || '',
      guestPhone: booking.phone || '',
      
      // Booking info
      bookingId: booking.id.toString(),
      bookingReference: booking.reference || booking.id.toString(),
      bookingStatus: booking.status,
      totalAmount: booking.totalAmount?.toFixed(2) || '0.00',
      currency: booking.property?.currency || 'INR',
      
      // Dates
      checkIn: formatDate(booking.checkIn),
      checkOut: formatDate(booking.checkOut),
      checkInTime: formatTime(booking.checkIn),
      checkOutTime: formatTime(booking.checkOut),
      checkInDate: booking.checkIn ? new Date(booking.checkIn).toISOString().split('T')[0] : '',
      checkOutDate: booking.checkOut ? new Date(booking.checkOut).toISOString().split('T')[0] : '',
      
      // Property info
      propertyName: booking.property?.name || '',
      propertyPhone: booking.property?.phone || '',
      propertyEmail: booking.property?.email || '',
      propertyAddress: booking.property?.address || '',
      propertyCity: booking.property?.city || '',
      
      // Room info
      roomType: booking.roomType?.name || '',
      roomTypeCode: booking.roomType?.code || '',
      
      // Nights
      nights: booking.nights || 0,
    };
  } catch (error) {
    console.error('Error getting booking context:', error);
    return null;
  }
}

/**
 * Replace template variables in a string
 * @param {string} template - Template string with variables like {{guestName}}
 * @param {object} context - Context object with variable values
 * @returns {string} - Rendered template
 */
function replaceVariables(template, context = {}) {
  if (!template) return '';
  
  let rendered = template;
  
  // Replace all {{variable}} patterns
  const variableRegex = /\{\{(\w+)\}\}/g;
  
  rendered = rendered.replace(variableRegex, (match, variableName) => {
    const value = context[variableName];
    
    // If variable not found, return the original match (or empty string)
    if (value === undefined || value === null) {
      console.warn(`Template variable ${variableName} not found in context`);
      return match; // Keep original {{variable}} if not found
    }
    
    return String(value);
  });
  
  return rendered;
}

/**
 * Render a template with booking context
 * @param {string} templateBody - Template body text
 * @param {string} templateSubject - Template subject (optional)
 * @param {number} bookingId - Booking ID
 * @returns {Promise<{subject: string, body: string}>}
 */
async function renderTemplate(templateBody, templateSubject, bookingId) {
  const context = await getBookingContext(bookingId);
  
  if (!context) {
    throw new Error(`Booking ${bookingId} not found`);
  }
  
  const body = replaceVariables(templateBody, context);
  const subject = templateSubject ? replaceVariables(templateSubject, context) : null;
  
  return { subject, body };
}

/**
 * Get available template variables for documentation
 */
function getAvailableVariables() {
  return [
    { name: 'guestName', description: 'Guest full name' },
    { name: 'guestEmail', description: 'Guest email address' },
    { name: 'guestPhone', description: 'Guest phone number' },
    { name: 'bookingId', description: 'Booking ID number' },
    { name: 'bookingReference', description: 'Booking reference code' },
    { name: 'bookingStatus', description: 'Current booking status' },
    { name: 'totalAmount', description: 'Total booking amount' },
    { name: 'currency', description: 'Currency code (e.g., INR)' },
    { name: 'checkIn', description: 'Check-in date (formatted)' },
    { name: 'checkOut', description: 'Check-out date (formatted)' },
    { name: 'checkInTime', description: 'Check-in time' },
    { name: 'checkOutTime', description: 'Check-out time' },
    { name: 'checkInDate', description: 'Check-in date (YYYY-MM-DD)' },
    { name: 'checkOutDate', description: 'Check-out date (YYYY-MM-DD)' },
    { name: 'propertyName', description: 'Property name' },
    { name: 'propertyPhone', description: 'Property phone number' },
    { name: 'propertyEmail', description: 'Property email' },
    { name: 'propertyAddress', description: 'Property address' },
    { name: 'propertyCity', description: 'Property city' },
    { name: 'roomType', description: 'Room type name' },
    { name: 'roomTypeCode', description: 'Room type code' },
    { name: 'nights', description: 'Number of nights' },
  ];
}

/**
 * Extract variables from a template string
 * @param {string} template - Template string
 * @returns {string[]} - Array of variable names found in template
 */
function extractVariables(template) {
  if (!template) return [];
  
  const variableRegex = /\{\{(\w+)\}\}/g;
  const variables = new Set();
  let match;
  
  while ((match = variableRegex.exec(template)) !== null) {
    variables.add(match[1]);
  }
  
  return Array.from(variables);
}

module.exports = {
  getBookingContext,
  replaceVariables,
  renderTemplate,
  getAvailableVariables,
  extractVariables,
};

