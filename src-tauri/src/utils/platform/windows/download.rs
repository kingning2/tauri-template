use std::env::consts::{ARCH, OS};

use crate::utils::platform::download::{SystemArch, SystemPlatform};

pub fn current_platform() -> Result<SystemPlatform, String> {
    match OS {
        "windows" => Ok(SystemPlatform::Windows),
        other => Err(format!("unsupported platform for windows resolver: {other}")),
    }
}

pub fn current_arch() -> Result<SystemArch, String> {
    match ARCH {
        "x86_64" => Ok(SystemArch::X64),
        "aarch64" => Ok(SystemArch::Arm64),
        other => Err(format!("unsupported architecture on windows resolver: {other}")),
    }
}
