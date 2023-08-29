import repoHome from "../support/object_repository/repoHomePage"
import repoProduct from "../support/object_repository/repoProductsPage"
import repoCart from "../support/object_repository/repoCartPage"

before(function () {
    cy.fixture('GuestOrderData').then(function (exm) {
        this.exm = exm;
    });
})

describe('Guest Order Flow', function () {
    let selectedProductId, productPageLocation, cartPageLocation;
    const objHomeRepo = new repoHome()
    const objProductRepo = new repoProduct()
    const objCartRepo = new repoCart()

    const selectProductQty = "1";

    function priceWithCurrency(price, currency = "$") {
        return `${currency}${price}`;
    }

    it('End to End Process for Guest Orders', function () {
        cy.visit('<baseUrl>')
        // select market
        objHomeRepo.btnSelectMarket().click()
        // select language
        objHomeRepo.btnUSMarketEnglish().click()
        // welcome message
        objHomeRepo.lblWelcomeMsg().contains(this.exm.WelcomeMessage)
        cy.waitFor5Sec();
        // hamburger menu click
        objHomeRepo.btnHIITMenu().click()
        // Select EyeLashes
        cy.selectEyeLashesMakeup()
        // ProductPage Title
        objProductRepo.lblProductPage().should('have.text', this.exm.ProductPageTitle)

        objProductRepo.frameThumbnails().should('be.visible')

        objProductRepo.productPageFirstItem().invoke('attr', 'id').then((id) => {
            selectedProductId = id.split('sku-')[1];
            cy.wrap(id).should('exist');

            cy.request(`<link>/${selectedProductId}`).then((res, a) => {
                console.log(res, a);

                const [selectedProductDetails] = res.body;
                const { name, child_items, price, sku
                } = selectedProductDetails;

                let selectedPName = name;
                let selectedPPrice = price;
                let selectedPSKU = sku;
                let totalSelectedProducts = '2';
                const tax = "To be determined";
                const shipping = 6.95;



                // Click ThumbNail item.
                objProductRepo.productPageFirstItem().click();


                // Loads products view
                cy.url().should('include', this.exm.productsViewRoute);

                // should load product page
                cy.get('#products').should('exist')

                // 11
                cy.get('.pdpItemName').should('have.text', name)

                // cy.get('.pdpAddToCart').then(()=>{
                //     if(child_items && child_items.length) {
                //         cy.get('.pdpAddToCart').should('be.disabled');
                //         cy.get('.pdpItemDropdown').click();

                //         cy.get('.reactSelect__menu-list .reactSelect__option ').first().click();
                //         selectedPName = child_items[0].name;
                //         selectedPPrice = child_items[0].price;
                //         selectedPSKU = child_items[0].sku;

                //         }
                // })
                // if(child_items && child_items.length) {
                cy.get('.pdpAddToCart').should('be.disabled');
                cy.get('.pdpItemDropdown').click();

                cy.get('.reactSelect__menu-list .reactSelect__option ').first().click();
                selectedPName = child_items[0].name;
                selectedPPrice = child_items[0].price;
                selectedPSKU = child_items[0].sku;

                // }


                // 12
                cy.get('.pdpAddToCart').should('not.be.disabled').should('have.text', `Add to cart(${priceWithCurrency(selectedPPrice)})`);
                // 13
                cy.get('.pdpAddToCart').click();

                // 14
                cy.get('[data-testid=mini-cart-items]').first().find('.pQty').should('have.text', '1');
                cy.get('[data-testid=mini-cart-items]').first().find('.pName').should('have.text', selectedPName);
                cy.get('[data-testid=mini-cart-items]').first().find('.pPrice').should('have.text', selectedPPrice);

                // FREE should be behind condition
                cy.get('[data-testid=mini-cart-items]').eq(1).find('.pQty').should('have.text', '1');
                cy.get('[data-testid=mini-cart-items]').eq(1).find('.pName').should('have.text', "YOUNIQUE DAILY·YOU liquid collagen shot sample");
                cy.get('[data-testid=mini-cart-items]').eq(1).find('.pPrice').should('have.text', '0.00');
                // 18
                cy.get('[data-testid="mini-cart"]')
                cy.get('[data-testid="checkout-button"]').click();

                // // ******* CART ********

                cy.url().should('include', this.exm.cartRoute);
                objCartRepo.cartPage().should('exist')
                // 0020
                objCartRepo.freeShippingBanner().should('exist')
                // 21
                // threshold how to check 


                // 0024 
                cy.get(".shoppingCart .item-container").first().find(".itemName").should('have.text', selectedPName);
                // 0025
                cy.get(".shoppingCart .item-container").first().find(".item-sku").should('have.text', selectedPSKU);
                //0026
                cy.get(".shoppingCart .item-container").first().find(".receiptLineTotal").should('have.text', priceWithCurrency(selectedPPrice));
                // 0027
                cy.get(".shoppingCart .item-container").first().find("[data-testid=quantityInput]").should('have.value', selectProductQty);
                //0028
                cy.get(".shoppingCart .item-container").first().find("[data-testid=removeItemButton]").should('exist');


                // footer

                cy.get(".cart-total-items").should('have.text', totalSelectedProducts);
                cy.get(".cartFooter .cart-subtotal").should('have.text', priceWithCurrency(selectedPPrice))// 
                cy.get(".cartFooter .tax").should('have.text', tax)// 
                cy.get(".cartFooter [data-testid='shippingDisplay']").should('have.text', priceWithCurrency(shipping))// 
                cy.get("#carttotal").should('have.text', `${priceWithCurrency(parseFloat(selectedPPrice) + shipping)} USD`)

                cy.get("[data-testid=check-out-guest] a").click();

                // // "Products/checkout"
                cy.get("#orderItems .lineItem").first().find(".pQty").contains(selectProductQty);
                cy.get("#orderItems .lineItem").first().find(".pName").contains(selectedPName);
                cy.get("#orderItems .lineItem").first().find(".pAmount").contains(priceWithCurrency(selectedPPrice));
                cy.get('.balTotal').first().contains(tax)
                cy.get(".balanceDue").first().contains(`${priceWithCurrency(parseFloat(selectedPPrice) + shipping)} USD`);
                cy.get("#totalSummaries .shippingFee").contains(priceWithCurrency(shipping));

                cy.intercept('<link>').as('interceptCall')
                cy.get("#sponsorSearch").type("pre senter");
                
                cy.wait('@interceptCall');
                cy.get(".ui-widget .ui-menu-item").first().click()
                cy.get(".presenterThankYou").should("be.visible");

                cy.wait(1000)
                // Form
                cy.get("#first_name").focus().blur();
                cy.get("#addressSection .first_nameformError").should('exist')
                cy.get("#first_name").focus().type(this.exm.shippingInformation.fName);

                cy.get("#last_name").focus().blur();
                cy.get("#addressSection .last_nameformError").should('exist')
                cy.get("#last_name").focus().type(this.exm.shippingInformation.lName);

                cy.get("#email").focus().blur();
                cy.get("#addressSection .emailformError").should('exist');
                cy.get("#email").focus().type(this.exm.shippingInformation.email);

                cy.get("#phone").focus().blur();
                cy.get("#addressSection .phoneformError").should('exist')
                cy.get("#phone").focus().type(this.exm.shippingInformation.phone);


                cy.get("#address1").focus().blur();
                cy.get("#addressSection .address1formError").should('exist')
                cy.get("#address1").focus().type(this.exm.shippingInformation.address1);

                cy.get("#city").focus().type(this.exm.shippingInformation.city);
                cy.get("#state").select(this.exm.shippingInformation.state);

                cy.get("#postalcodelookup").focus().blur();
                cy.get("#addressSection .postalcodelookupformError").should('exist')
                cy.get("#postalcodelookup").focus().type(this.exm.shippingInformation.zipcode);

                cy.intercept('<url>').as('calculateCall');
                cy.get("#continuePaymentBtn .continue").click();
                // cy.wait(1000)
                cy.wait('@calculateCall');
                cy.get("#QAS_AcceptOriginal").click();
               
                
                cy.get("[data-testid=continueShippingMethod]").click();
                cy.get("#donation_step").should('exist');
                
                cy.get(".donation_amt_box").first().click();
             
                cy.get("#donationReject").should('exist');


                cy.get(".braintree-option__card").click();
                // cy.wait(35000)
                cy.getIFrame('#braintree-hosted-field-number').find("#credit-card-number").type(this.exm.shippingInformation.creditCardNo);
                cy.getIFrame('#braintree-hosted-field-expirationDate').find("#expiration").type(this.exm.shippingInformation.exp);
                cy.getIFrame('#braintree-hosted-field-cvv').find("#cvv").type(this.exm.shippingInformation.cvv);

                cy.wait(3000)
                cy.get('.continue span[data-original-text="Continue"]').click();
                cy.intercept('https://stagingbeta.youniqueproducts.com/api/shoppingcart/purchase').as('purchaseCall');
                cy.get("#submit-order").click();
                // cy.intercept('api/language/').as('languageCall')
                cy.wait('@purchaseCall');
                // cy.wait('@languageCall')
                cy.wait(10000)     
                cy.url().should("include", this.exm.recieptRoute);
                cy.get('.cartTable tbody').first().find('.td-product a').contains(selectedPName);
                cy.get('.cartTable tbody').first().find('.td-qty').contains('1');
                cy.get('.cartTable tbody').first().find('.td-total').contains(priceWithCurrency(selectedPPrice));
                cy.get('.cartTable tbody').first().find('.td-product .sku').contains(selectedPSKU);
                cy.get('.subTotal').contains(selectedPPrice);
                cy.get('.shippingTotal').contains(priceWithCurrency(shipping));
                cy.get('.flatList .actionButtons').should('exist')
                cy.get('.cartTable tbody').then((el)=>{

                    const finalTax = el.find('.itemTax').text().split("$")[1].trim();
                    const donation = el.find('.grandTotal').eq(1).find('td').eq(2).text().split("$")[1].trim();
                    const totalPrice = parseFloat(selectedPPrice) + shipping + parseFloat(finalTax) +  parseFloat(donation)
                    
                    cy.get('.balancedue').contains(`${totalPrice}`);

                })
                

            })
        })
    });
})