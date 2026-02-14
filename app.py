from xmlrpc import client
from flask import Flask, render_template, request, redirect, url_for, session, flash,jsonify
from flask_mysqldb import MySQL
import MySQLdb.cursors 
from flask_bcrypt import Bcrypt
from functools import wraps
from flask import make_response
from datetime import datetime
import json
import razorpay



app = Flask(__name__)
app.secret_key = "secret123"

# ---------------- MYSQL CONFIG ----------------

app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''   # XAMPP default
app.config['MYSQL_DB'] = 'users_db'
# app.config['MYSQL_PORT'] = 3307
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'

mysql = MySQL(app)
bcrypt = Bcrypt(app)


# RAZORPAY
razorpay_client = razorpay.Client(
    auth=("rzp_test_S7iRmjZi7yZupx", "BwGBNcISNA3F7uSssIAM30Oh")
)
# ---------------- ROUTES ----------------

@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('home'))
    
    response = make_response(render_template('loginandregister.html'))
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response


# --------------login required decorator---------------

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash("Please login first", "warning")
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function

# -------- HOME --------

@app.route('/home')
@login_required
def home():
    if 'user_id' not in session:
        return redirect(url_for('index'))  # bina login access block
    return render_template('index.html')

# -------- ABOUT --------

@app.route('/about')
@login_required
def about():
    return render_template('about.html')

    
# -------- MENU --------

@app.route('/menu')
@login_required
def menu():
    return render_template('menu.html')



# -------- REGISTER --------

@app.route('/register', methods=['POST'])
def register():
    username = request.form['username']
    email = request.form['email']
    password = request.form['password']

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    cur = mysql.connection.cursor()

     # 🔍 Check already exists

    cur.execute(
        "SELECT * FROM users WHERE email = %s OR username = %s",
        (email, username)
    )
    existing_user = cur.fetchone()

    if existing_user:
        flash("Email or Username already registered!", "danger")
        return redirect(url_for('index'))
    
        # ➕ Insert new user

    cur.execute(
        "INSERT INTO users (username, email, password) VALUES (%s, %s, %s)",
        (username, email, hashed_password)
    )
    mysql.connection.commit()
    cur.close()

    flash("Registration Successful! Please Login.", "success")
    return redirect(url_for('index'))


# -------- LOGIN --------

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']

    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM users WHERE username = %s", [username])
    user = cur.fetchone()
    cur.close()

    if user and bcrypt.check_password_hash(user['password'], password):
        session['loggedin'] = True
        session['user_id'] = user['id']
        session['username'] = user['username']

        return redirect(url_for('home'))   # 👈 index.html open hoga
    else:
        flash("Invalid Username or Password", "danger")
        return redirect(url_for('index'))



# -------- LOGOUT --------

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

# -=----------------sab protected pages par cache disable karne ke liye----------------

@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response













# ----------CHECKOUT PAGE------------------
@app.route("/checkout")
@login_required
def checkout():
    cart = session.get('cart', [])

    if not cart:
        flash("Cart empty", "warning")
        return redirect(url_for("menu"))

    total = sum(i['price'] * i['qty'] for i in cart)
 # ✅ DEFINE ITEMS TOTAL
    items_total = sum(item['price'] * item['qty'] for item in cart)

    # ✅ DELIVERY FEE
    delivery_fee = 10

    # ✅ GRAND TOTAL
    total = items_total + delivery_fee
    delivery_fee = 10   # 👈 FIXED delivery charge (₹30)
    grand_total = items_total + delivery_fee

    return render_template("checkout.html", cart=cart, total=total, delivery_fee=delivery_fee,grand_total=grand_total)


# ----------------SYNC CART----------------------
@app.route("/sync-cart", methods=["POST"])
def sync_cart():
    session['cart'] = request.json
    session.modified = True
    return jsonify({"status": "ok"})
# ----------------ADD TO CART----------------------
@app.route('/add_to_cart', methods=['POST'])
def add_to_cart():
    item = {
        'name': request.form['name'],
        'price': int(request.form['price']),
        'qty': 1
    }

    if 'cart' not in session:
        session['cart'] = []

    session['cart'].append(item)
    session.modified = True
    return redirect('/checkout')

# ----------------CREATE ORDER + ADDRESS SAVE----------------------
@app.route("/create-order", methods=["POST"])
@login_required
def create_order():

    cart = session.get('cart', [])
    if not cart:
        return redirect(url_for("menu"))

    # 🔐 TEMPORARY: address + form data session me rakho
    session['checkout_form'] = request.form.to_dict()

    items_total = sum(i['price'] * i['qty'] for i in cart)
    delivery_fee = 10
    total = items_total + delivery_fee

    # Razorpay order
    rp_order = razorpay_client.order.create({
        "amount": total * 100,
        "currency": "INR",
        "payment_capture": 1
    })

    session['amount'] = total
    session['rp_order_id'] = rp_order['id']

    return render_template(
        "payment.html",
        order_id=rp_order['id'],
        amount=total,
        razorpay_key="rzp_test_S7iRmjZi7yZupx"
    )

# ----------------ORDER SUCCESS PAGE------------------

@app.route("/order-success")
@login_required
def order_success():
    # return render_template("order_success.html")
    
     # ❌ Direct access block
    if not session.get('order_success_allowed'):
        return redirect(url_for('home'))

    data = session.get("success_order")
    if not data:
        return redirect(url_for("home"))
    
       # 🔥 IMPORTANT: one-time access
    session.pop('order_success_allowed', None)


    delivery_charge = 10
    items = data.get("items", [])
    total_amount = sum(item['price'] * item['qty'] for item in items) + delivery_charge

    
    order_date = datetime.now().strftime("%d/%m/%Y")
    return render_template(
        "order_success.html",
        # order_id=data["order_id"],
        payment_id=data["payment_id"],
          delivery_charge=delivery_charge,
        order_date=order_date,
        total_amount=data["total_amount"],
        items=data["items"]
    )



# ---------------------PAYMENT SUCCESS → SAVE ORDER------------------
@app.route("/payment-success", methods=["POST"])
@login_required
def payment_success():

    data = request.json
    user_id = session['user_id']
    cart = session.get('cart', [])
    form = session.get('checkout_form')

    cur = mysql.connection.cursor(MySQLdb.cursors.DictCursor)

    # 1️⃣ Save address
    cur.execute("""
        INSERT INTO addresses
        (user_id, mobile, house, street, landmark, city, pincode, address_type)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        user_id,
        form['phone'],  # correct key for phone number
        form['house'],
        form['street'],
        form.get('landmark'),
        form['city'],
        form['pincode'],
        form['address_type']
    ))
    address_id = cur.lastrowid

    # 2️⃣ Save order
    cur.execute("""
        INSERT INTO orders
        (user_id, total_amount, payment_status, payment_id, address_id ,status)
        VALUES (%s,%s,%s,%s,%s,%s)
    """, (
        user_id,
        session['amount'],
        "Success",
        data['razorpay_payment_id'],
        address_id,
        "placed"
    ))
    order_id = cur.lastrowid

    # 3️⃣ Save order items
    for item in cart:
        cur.execute("""
            INSERT INTO order_items
            (order_id, item_name, quantity, price)
            VALUES (%s,%s,%s,%s)
        """, (
            order_id,
            item['name'],
            item['qty'],
            item['price']
        ))
        

    mysql.connection.commit()

    # 4️⃣ Clear cart
    session.pop('cart', None)
    session.pop('checkout_form', None)

    session['success_order'] = {
    "order_id": order_id,
    "payment_id": data['razorpay_payment_id'],
    "order_date": "Today",  # ya DB se
    "total_amount": session['amount'],
    "items": cart
}

    session['order_success_allowed'] = True  

    return {"status": "success"}

# -----------myorders page-----------------
@app.route("/my-orders")
@login_required
def my_orders():

    user_id = session['user_id']
    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)

    # 🔥 ALL orders of user
    cursor.execute("""
        SELECT id, total_amount, status, created_at
        FROM orders
        WHERE user_id = %s
        ORDER BY id DESC
    """, (user_id,))
    orders = cursor.fetchall()

    # print("USER ID:", user_id)
    # print("ORDERS:", orders)  # DEBUG

    return render_template(
        "myorders.html",
        orders=orders
    )
# @app.route("/my-orders")
# @login_required
# def my_orders():

    # 🔒 Login check
    # if 'user_id' not in session:
    #     return redirect('/login')

    # user_id = session['user_id']
    # cursor = mysql.connection.cursor()

    # 🧾 Latest order of logged-in user
    # cursor.execute("""
    #     SELECT id , status, created_at
    #     FROM orders 
    #     WHERE user_id = %s 
    #     ORDER BY id DESC 
    # """, (user_id,))
    # order = cursor.fetchone()
    
    # print("USER ID:", user_id)
    # print("ORDERS:", order)   # 👈 DEBUG

    # if not order:
    #     return render_template("myorders.html", items=[], subtotal=0, delivery_fee=0, total_amount=0)

    # order_id = order['id']

    # 📦 Order items
    # cursor.execute("""
    #     SELECT item_name, price, quantity
    #     FROM order_items
    #     WHERE order_id = %s
    # """, (order_id,))
    # items = cursor.fetchall()

    # 💰 Calculations
    # subtotal = sum(i['price'] * i['quantity'] for i in items)
    # delivery_fee = 10
    # total_amount = subtotal + delivery_fee

    # invoice_date = datetime.now().strftime("%d/%m/%Y %H:%M")

    # return render_template(
    #     "myorders.html",
    #     items=items,
    #     subtotal=subtotal,
    #     delivery_fee=delivery_fee,
    #     total_amount=total_amount,
    #        invoice_date=invoice_date,
    #          order_status=order['status']
    # )




# ----------------------sigle order details page--------------------------

@app.route("/order/<int:order_id>")
@login_required
def order_details(order_id):

    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)

    cursor.execute("""
        SELECT * FROM orders
        WHERE id=%s AND user_id=%s
    """, (order_id, session['user_id']))
    order = cursor.fetchone()

    if not order:
        flash("Order not found", "danger")
        return redirect("/my-orders")

    cursor.execute("""
        SELECT item_name, price, quantity
        FROM order_items
        WHERE order_id=%s
    """, (order_id,))
    items = cursor.fetchall()

    subtotal = sum(i['price'] * i['quantity'] for i in items)
    delivery_fee = 10

    return render_template(
        "myorder.html",
        items=items,
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        total_amount=order['total_amount'],
        invoice_date=order['created_at'].strftime("%d/%m/%Y %H:%M"),
        order_status=order['status']
    )

# --------------------ORDER STATUS API----------------------


@app.route("/order-status/<int:order_id>")
@login_required
def order_status(order_id):
    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute(
        "SELECT status FROM orders WHERE id=%s AND user_id=%s",
        (order_id, session['user_id'])
    )
    order = cursor.fetchone()

    if not order:
        return jsonify({"error": "Not found"}), 404

    return jsonify({"status": order['status']})



# ---------------- OLD CHECKOUT PAGES (COMMENTED) ----------------
# @app.route("/checkout")
# @login_required
# def checkout():
#     return render_template("checkout.html")



# Checkout page
# @app.route("/checkout")
# def checkout():
#     return render_template("checkout.html")

# Place Order (DB Save)
# @app.route('/place_order', methods=['POST'])
# @login_required
# def place_order():

#     name = request.form['name']
#     mobile = request.form['mobile']
#     email = request.form['email']
#     address = request.form['address']
#     total = request.form['total']

#     user_id = session.get('user_id')

#     cursor = mysql.connection.cursor()

#     cursor.execute("""
#         INSERT INTO orders (user_id, name, mobile, email, address, total)
#         VALUES (%s, %s, %s, %s, %s, %s)
#     """, (user_id, name, mobile, email, address, total))

#     mysql.connection.commit()

    # 🔥 YAHI MISSING THA
    # order_id = cursor.lastrowid

    # return redirect(url_for('payment', order_id=order_id))



#  Payment Page
# @app.route("/payment/<int:order_id>")
# def payment(order_id):
#     return render_template("payment.html", order_id=order_id)

#  My Orders Page
# @app.route("/myorders")
# @login_required
# def myorders():
#     user_id = session['user_id']

#     cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
#     cursor.execute(
#         "SELECT * FROM orders WHERE user_id = %s ORDER BY id DESC",
#         (user_id,)
#     )
#     orders = cursor.fetchall()

#     return render_template("myorders.html", orders=orders)

# ---------------- RUN ----------------

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5000)
