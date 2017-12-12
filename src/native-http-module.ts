import { NgModule } from '@angular/core';
import { HTTP } from '@ionic-native/http';
import { HttpClientModule } from '@angular/common/http';
import { NativeHttpBackend } from './native-http-backend';

@NgModule({
    imports: [HttpClientModule],
    providers: [HTTP, NativeHttpBackend],
})
export class NativeHttpModule {}
