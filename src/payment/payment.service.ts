import { Injectable } from '@nestjs/common';
import { SharedService } from 'src/shared/shared.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {

    private stripe: Stripe;
    constructor(private readonly sharedService: SharedService) {
        const secretKey = 'sk_test_51NXcYQKN36dse1aEviDU9Hfbkz3iBpNSfLeM8Iax1LYMNcS0xxRWAqp2kLvo7UKjKqTuFvvcFD4DJpTgMdJHh7aJ00YWMH0xx5';
        this.stripe = new Stripe(secretKey, { apiVersion: '2022-11-15' });
    }
    async createCheckoutSession(payload: any): Promise<any> {
        // // Đầu tiên, bạn cần lấy thông tin về hình ảnh từ cơ sở dữ liệu của ứng dụng
        // const asset = await this.sharedService.getAssetById(assetId);

        // // Tiếp theo, bạn tạo phiên thanh toán với thông tin hình ảnh và giá cả
        // const session = await this.stripe.checkout.sessions.create({
        //     payment_method_types: ['card'],
        //     line_items: [
        //         {
        //             price_data: {
        //                 currency: 'usd',
        //                 product_data: {
        //                     name: asset.assetName,
        //                     images: [asset.assetUrl],
        //                 },
        //                 unit_amount: 900 || 0,
        //             },
        //             quantity: 1,
        //         },
        //     ],
        //     mode: 'payment',
        //     success_url: 'http://localhost:7200/payment/success',
        //     cancel_url: 'http://localhost:7200',
        // });

        // return session.id;


        try {
            const session = await this.stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: payload.priceId,
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                success_url: 'http://staging.pomodoro.atseeds.com',
                cancel_url: 'http://staging.pomodoro.atseeds.com',
            });
            // console.log(session);

            return {
                statusCode: 200,
                data: {
                    url: session.url,
                }
            }
        } catch (error) {
            console.error(error);
            //   res.status(500).json({ error: 'An error occurred.' });
            // res.status(500).json({ error: JSON.stringify(error) });
        }


    }

    async handleSuccessfulPayment(sessionId: string, assetId: number): Promise<any> {
        // Ở đây, bạn có thể thực hiện các thao tác sau khi thanh toán thành công,
        // chẳng hạn cập nhật cơ sở dữ liệu để đánh dấu rằng hình ảnh đã được mua.
        console.log("payment success");
        return {
            message: 'Payment successful!',
        }
    }

    async createSubscription(createSubscriptionRequest): Promise<any> {

        // create a stripe customer
        const customer = await this.stripe.customers.create({
            name: createSubscriptionRequest.name,
            email: createSubscriptionRequest.email,
            payment_method: createSubscriptionRequest.paymentMethod,
            invoice_settings: {
                default_payment_method: createSubscriptionRequest.paymentMethod,
            },
        });


        // get the price id from the front-end
        const priceId = createSubscriptionRequest.priceId;

        // create a stripe subscription
        const subscription: any = await this.stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: priceId }],
            payment_settings: {
                payment_method_options: {
                    card: {
                        request_three_d_secure: 'any',
                    },
                },
                payment_method_types: ['card'],
                save_default_payment_method: 'on_subscription',
            },
            expand: ['latest_invoice.payment_intent'],
        });

        // return the client secret and subscription id
        return {
            clientSecret: (subscription.latest_invoice as any).payment_intent.client_secret,
            subscriptionId: subscription.id,
        };
    }

    async getListProduct(): Promise<any> {
        const prices = await this.stripe.prices.list({ active: true });
        return {
            statusCode: 200,
            data: prices.data.reverse()
        }
    }

}
