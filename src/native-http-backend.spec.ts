import { HTTPMock } from './http.mock';
import {
    HttpErrorResponse,
    HttpHeaders,
    HttpRequest,
    HttpResponse,
} from '@angular/common/http';
import { NativeHttpBackend } from './native-http-backend';

describe('NativeHttpBackend', () => {
    let http: HTTPMock;
    let httpBackend: NativeHttpBackend;

    beforeEach(() => {
        http = new HTTPMock();
        httpBackend = new NativeHttpBackend(http);
    });

    it('throws error on not allowed method', () => {
        expect(() => {
            const request = new HttpRequest(
                'OPTIONS',
                'http://some-url',
                'some-body',
            );
            httpBackend.handle(request);
        }).toThrow(
            'Only GET, POST, PUT, DELETE, PATCH and HEAD methods are supported by the current Native HTTP version',
        );
    });

    it('still works on errors with success status', (done: () => void) => {
        const request = new HttpRequest('POST', '', '');

        httpBackend
            .handle(request)
            .subscribe((response: HttpResponse<string>) => {
                expect(response.body).toEqual({});
                expect(response.status).toEqual(201);
                done();
            });

        http.requestReject({
            error: '{}',
            status: 201,
        });
    });

    it('initiates error when response is successful but status is not', done => {
        const request = new HttpRequest('POST', '', '');

        httpBackend.handle(request).subscribe(
            () => {
                done.fail();
            },
            (response: HttpErrorResponse) => {
                expect(response.status).toEqual(500);
                done();
            },
        );

        http.requestResolve({
            status: 500,
            headers: {},
        });
    });

    it('correctly transforms request body and headers to Native HTTP requirements', done => {
        const request = new HttpRequest('POST', 'http://test.com', 'a=b&c=d', {
            headers: new HttpHeaders({
                headerName1: ['headerValue1'],
                headerName2: ['headerValue2'],
            }),
        });

        spyOn(http, 'post').and.returnValue(
            Promise.resolve({
                status: 200,
                data: '{}',
                headers: {},
            }),
        );

        httpBackend.handle(request).subscribe(() => {
            expect(http.post).toHaveBeenCalledWith(
                expect.anything(),
                {
                    a: 'b',
                    c: 'd',
                },
                {
                    headerName1: 'headerValue1',
                    headerName2: 'headerValue2',
                },
            );
            done();
        });
    });

    it('converts HTTPResponse headers object to Headers', done => {
        const request = new HttpRequest('POST', 'http://test.com', 'a=b&c=d');

        spyOn(http, 'post').and.returnValue(
            Promise.resolve({
                status: 200,
                data: '{}',
                headers: {
                    header1: 'value1',
                    header2: 'value2',
                },
            }),
        );

        httpBackend
            .handle(request)
            .subscribe((response: HttpResponse<string>) => {
                expect(response.headers.get('header1')).toBe('value1');
                expect(response.headers.get('header2')).toBe('value2');
                done();
            });
    });

    it('should set json serializer when post json request', () => {
        const request = new HttpRequest('POST', 'http://test.com', { a: 'b' });

        spyOn(http, 'setDataSerializer');

        httpBackend.handle(request).subscribe();
        expect(http.setDataSerializer).toHaveBeenCalledWith('json');
    });

    it('should set urlencode serializer when post plain request', () => {
        const request = new HttpRequest('POST', 'http://test.com', 'a=b');

        spyOn(http, 'setDataSerializer');

        httpBackend.handle(request).subscribe();
        expect(http.setDataSerializer).toHaveBeenCalledWith('urlencoded');
    });

    it(`uses the first request header in case it is an array`, done => {
        const request = new HttpRequest('POST', 'http://test.com', 'a=b&c=d', {
            headers: new HttpHeaders({
                headerName1: ['header1Value1', 'header1Value2'],
                headerName2: 'header2Value1',
            }),
        });

        spyOn(http, 'post').and.returnValue(
            Promise.resolve({
                status: 200,
                data: '{}',
                headers: {},
            }),
        );

        httpBackend.handle(request).subscribe(() => {
            expect(http.post).toHaveBeenCalledWith(
                expect.anything(),
                expect.anything(),
                {
                    headerName1: 'header1Value1',
                    headerName2: 'header2Value1',
                },
            );
            done();
        });
    });

    it('should encode URL', done => {
        const request = new HttpRequest(
            'POST',
            'http://api.com/get something?with= wierd variables ',
            'a=b&c=d',
        );

        spyOn(http, 'post').and.returnValue(
            Promise.resolve({
                status: 200,
                data: '{}',
                headers: {},
            }),
        );

        httpBackend.handle(request).subscribe(() => {
            expect(http.post).toHaveBeenCalledWith(
                'http://api.com/get%20something?with=%20wierd%20variables%20',
                expect.anything(),
                expect.anything(),
            );
            done();
        });
    });

    it('should not encode already encoded URL', done => {
        const request = new HttpRequest(
            'POST',
            'http://api.com/get%20something?with=%20wierd%20variables%20',
            'a=b&c=d',
        );

        spyOn(http, 'post').and.returnValue(
            Promise.resolve({
                status: 200,
                data: '{}',
                headers: {},
            }),
        );

        httpBackend.handle(request).subscribe(() => {
            expect(http.post).toHaveBeenCalledWith(
                'http://api.com/get%20something?with=%20wierd%20variables%20',
                expect.anything(),
                expect.anything(),
            );
            done();
        });
    });
});
