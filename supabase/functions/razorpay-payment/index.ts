import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Razorpay API helpers
async function createRazorpayOrder(amount: number, receipt: string, keyId: string, keySecret: string) {
  const auth = btoa(`${keyId}:${keySecret}`);
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100), // Convert to paise
      currency: "INR",
      receipt: receipt,
      payment_capture: 1,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Razorpay order creation failed: ${error}`);
  }

  return response.json();
}

async function verifyPayment(paymentId: string, keyId: string, keySecret: string) {
  const auth = btoa(`${keyId}:${keySecret}`);
  const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    method: "GET",
    headers: {
      "Authorization": `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    throw new Error("Payment verification failed");
  }

  return response.json();
}

async function generateQRCode(orderId: string, amount: number, keyId: string, keySecret: string) {
  const auth = btoa(`${keyId}:${keySecret}`);
  const response = await fetch(`https://api.razorpay.com/v1/payments/qr/${orderId}`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "upi_qr",
      name: "Pasumai Integrated Farm",
      usage: "single_use",
      customer_id: null,
      notes: {
        purpose: `Order ${orderId}`,
      },
    }),
  });

  if (!response.ok) {
    // QR generation might not be available, return null
    return null;
  }

  return response.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error("Razorpay credentials not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to Edge Function secrets.");
    }

    const body = await req.json();
    const { action, orderId, paymentId, signature, amount, type, recordId } = body;

    // Supabase client setup
    const supabaseHeaders = {
      "apikey": supabaseServiceKey,
      "Authorization": `Bearer ${supabaseServiceKey}`,
      "Content-Type": "application/json",
    };

    if (action === "create_order") {
      // Create Razorpay order
      const receipt = `pasumai_${Date.now()}_${recordId?.slice(0, 8) || 'order'}`;
      const razorpayOrder = await createRazorpayOrder(amount, receipt, razorpayKeyId, razorpayKeySecret);

      // Update the database record with Razorpay order ID
      if (type && recordId) {
        const tableMap: Record<string, string> = {
          "order": "orders",
          "cottage": "cottage_bookings",
          "farm_visit": "farm_visits",
          "hall": "hall_bookings",
        };
        const table = tableMap[type];
        if (table) {
          await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${recordId}`, {
            method: "PATCH",
            headers: supabaseHeaders,
            body: JSON.stringify({
              razorpay_order_id: razorpayOrder.id,
              payment_status: "pending",
            }),
          });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          razorpayOrderId: razorpayOrder.id,
          razorpayKey: razorpayKeyId,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          receipt: razorpayOrder.receipt,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify_payment") {
      // Verify payment signature
      const crypto = await import("node:crypto");
      const expectedSignature = crypto
        .createHmac("sha256", razorpayKeySecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      const isValid = expectedSignature === signature;

      if (!isValid) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid payment signature" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get payment details from Razorpay
      const paymentDetails = await verifyPayment(paymentId, razorpayKeyId, razorpayKeySecret);

      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
          paymentStatus: paymentDetails.status,
          paymentMethod: paymentDetails.method,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "update_payment_status") {
      // Update payment status in database
      if (!type || !recordId) {
        throw new Error("Type and recordId are required");
      }

      const tableMap: Record<string, string> = {
        "order": "orders",
        "cottage": "cottage_bookings",
        "farm_visit": "farm_visits",
        "hall": "hall_bookings",
      };
      const table = tableMap[type];
      if (!table) {
        throw new Error("Invalid type");
      }

      // Verify payment signature first
      const crypto = await import("node:crypto");
      const expectedSignature = crypto
        .createHmac("sha256", razorpayKeySecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      const isValid = expectedSignature === signature;

      if (!isValid) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid payment signature" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update the record
      const updateData = {
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        payment_status: "paid",
        status: "confirmed",
      };

      await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${recordId}`, {
        method: "PATCH",
        headers: supabaseHeaders,
        body: JSON.stringify(updateData),
      });

      // If it's an order, reduce stock
      if (type === "order") {
        // Get order items
        const itemsResponse = await fetch(
          `${supabaseUrl}/rest/v1/order_items?order_id=eq.${recordId}`,
          { headers: supabaseHeaders }
        );
        const items = await itemsResponse.json();

        // Reduce stock for each item
        for (const item of items) {
          if (item.product_id) {
            await fetch(`${supabaseUrl}/rest/v1/rpc/reduce_product_stock`, {
              method: "POST",
              headers: supabaseHeaders,
              body: JSON.stringify({
                p_product_id: item.product_id,
                p_quantity: item.quantity,
              }),
            });
          }
        }
      }

      // Create notification for user
      const recordResponse = await fetch(
        `${supabaseUrl}/rest/v1/${table}?id=eq.${recordId}&select=user_id`,
        { headers: supabaseHeaders }
      );
      const recordData = await recordResponse.json();

      if (recordData.length > 0 && recordData[0].user_id) {
        await fetch(`${supabaseUrl}/rest/v1/notifications`, {
          method: "POST",
          headers: supabaseHeaders,
          body: JSON.stringify({
            user_id: recordData[0].user_id,
            title: "Payment Successful!",
            message: `Your ${type} payment of ₹${amount} has been confirmed. Reference: ${paymentId.slice(-8)}`,
            type: "success",
            reference_id: recordId,
            reference_type: type,
          }),
        });
      }

      return new Response(
        JSON.stringify({ success: true, message: "Payment status updated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
