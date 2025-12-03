This project is about to create an application to allow managing a restaurant or prepared food business (bakery, etc).

I want to split the application into two parts:

1. Administration and setup system. To work online.
2. Point of sale system. To work offline (desktop or mobile mode), and sync with the administration and setup system.
3. Both ui and backend should implement a hook system to allow customizing the application to the needs of the business.
3. Both applications should allow for multiple languages.
4. Base language must be English.
5. All texts should be translated to Spanish by default.
6. Setup Spannish as default language during development.
7. It should be easy to handle translations files to add new languages.

3. Administration App should allow for:
    - Creating and managing stores.
    - Creating and managing users.
    - Creating and managing roles and permissions.
        - Suggest roles and permissions based on your experience and knowledge of the industry.
    - Creating and managing products.
    - Creating and managing materials (ingredients).
    - Creating and managing recipes (products made from materials).
    - Creating and managing product categories.
    - Creating and managing product tags.
    - Creating and managing product images.
    - Creating and managing product prices.
    - Creating and managing product/materials unit of measures.
    - Creating and managing unit of measures.
    - Creating and managing taxes.
    - Creating and managing product taxes.
    - Creating and managing product discounts.
    - Creating and managing vendors.
    - Creating and managing customers.
    - Creating and managing inventory entries (purchases and inventory transactions).
    - Creating and managing payments.
    - Creating and managing reports.
    - Creating and managing settings.
    - Allow to configure which products / materials requires inventory control and allow to choose up to 3 units of measure to count for each product / material.
    - Allow to configure selling prices for each product by uofm.
    - Allow to setup payment methods. (Cash / Credit Card / Debit Card / Bank Transfer)
    - Allow to configure top selling products. So they appear as a category in the POS app.
    - Allow to configure number default # of tables per store.
    - Allow to view open cash registers and cash registers history.
    - 

4 POS App should allow for:
    - Standalone application that can be installed on a computer or mobile device. (work offline and keep sync with the administration and setup system)
    - Allow to setup an store during installation. 
    - Allow to open / close shifts.
        - Add people to a shift.
        - Remove people from a shift (Permission required and password confirmation)
    - Allow to configure when inventory stock counts are required at start and end of shift.
    - Allow to record inventory entries during a shift.
    - Allow to open / close cash registers during a shift.
    - Allow to record sales during a shift.
    - Allow to configure when selling products without inventory is allowed.
    - Allow to sell by table. (An order is opened but it is not paid yet. Can be paid later or at the same time as the order.)
    - Allow to add tables to the store.
    - Display a tables grid. 
        Each tile of the grid should be a table showing information like:
            - Table number.
            - Table name.
            - Table status. (Open / Closed)
            - Table capacity.
            - Table location.
            - Status of the order. (Open / Closed)

5. Administration App should allow for:



Please lets start by designing the database schema to support the requirements above.
Want to support postgres database / but mysql should also be supported. I think SQL Alchemy should be the way to go. No SQL scripts only python code.

Then define the management system layout and component hierarchy. We should use a modular approach to the UI and clearly identify components that can be reused and than helps keep the code clean, easy to maintain and separation of concerns well defined.

Before starting to code. I would like to define a set of user stories to guide the development process.


This is the POS System Layout that I would like to use. Please lets start by defining the layout and component hierarchy required to implement this layout.


POS Screen Layout

-----------------------------------------------------
|                   TOP BAR                         |
-----------------------------------------------------
                                    |               |
                                    |               |
                                    |               |
                                    |  ORDER DETAILS|
PRODUCT SELECTION PANEL             |  PANEL        |
                                    |               |
                                    |               |
                                    |               |
                                    |               |
-----------------------------------------------------
                    BOTTOM BAR
-----------------------------------------------------


TOP BAR

--------------------------------------------------------------
APP DETAILS | USER DETAILS | CURRENT TIME   | ACTION BUTTONS |
--------------------------------------------------------------

APP DETAILS
-----------------
APP NAME OR LOGO 
WITH VERSION
-----------------

USER DETAILS
Username: xxxx

ACTION BUTTONS
LOGOUT
CLOSE SHIFT
INVENTORY ENTRY


PRODUCT SELECTION PANEL

--------------------------------------
SCAN BUTTON | SEARCH BAR              
--------------------------------------
SCROLLABLE CATEGORIES
--------------------------------------
                                |S   |
                                |C   |
                                |R   |
                                |OL  |
                                |LA  |
        PRODUCT LIST            |AB  |
                                |LE  |
                                |    |
                                |GR  |
                                |OU  |
                                |PS  |
                                |    |


PRODUCT LIST (List or Tiles)

PRODUCT VIEW | PRODUCT VIEW  | PRODUCT VIEW
PRODUCT VIEW | PRODUCT VIEW  | PRODUCT VIEW
PRODUCT VIEW | PRODUCT VIEW  | PRODUCT VIEW
PRODUCT VIEW | PRODUCT VIEW  | PRODUCT VIEW
PRODUCT VIEW | PRODUCT VIEW  | PRODUCT VIEW


PRODUCT VIEW (Depends on the layout selected, if no image available display a generic image, when applies)
ITEM NAME | DESCRIPTION | PRICE | QTY AVAILABLE



ORDER DETAILS PANEL

------------------------------------
CUSTOMER DISPLAY / SELECTION BAR
------------------------------------
ORDER DETAILS DISPLAY
------------------------------------
ORDER TOTALS
------------------------------------
SAVE DRAFT | PAY BUTTON | CANCEL BUTTON | PRINT RECEIPT (If already paid)


CUSTOMER DISPLAY
------------------------------------
DEFAULT CUSTOMER NAME| LOOKUP BUTTON | NEW BUTTON
------------------------------------

ORDER DETAILS DISPLAY
------------------------------------
PRODUCT NAME | QTY | PRICE | TOTAL
------------------------------------
[Description]|Decrease button|Qty with Link to edit qty|Increase button|Extended Price
[Unit Price]
------------------------------------

ORDER TOTALS
------------------------------------
Subtotal: 000
Taxes: 000
Discount: 000
Total: 000
------------------------------------

![Payment Screen Layout](image.png)

Only Cash and Bank Transfer payment methods are allowed.

Technology to be used:
    Use FastAPI for the backend.
    Use React for the frontend.
    Use Tankstack Query for the data fetching.
    Use Tankstack Router for the routing
    Use Tankstack Table for the tables
    Use Tailwind CSS for the styling.
    Use React Hook Form for the form handling.
    Use React Toastify for the notifications.
    Use React Icons for the icons.
